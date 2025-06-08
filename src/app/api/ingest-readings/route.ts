
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { SENSOR_TYPES_ARRAY } from '@/lib/mock-data';
import { revalidatePath } from 'next/cache';

const logFailedRequest = (
  request: NextRequest,
  payload: any,
  errorType: string,
  errorDetails: any,
  statusCode: number,
  deviceIdAttempted?: string
) => {
  try {
    const logStmt = db.prepare(
      'INSERT INTO api_request_logs (timestamp, ip_address, method, path, device_id_attempted, payload_received, error_type, error_details, status_code_returned) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    logStmt.run(
      new Date().toISOString(),
      request.headers.get('x-forwarded-for') || request.ip || null,
      request.method,
      request.nextUrl.pathname,
      deviceIdAttempted || (payload && payload.device_id) || null,
      payload ? JSON.stringify(payload) : null,
      errorType,
      typeof errorDetails === 'string' ? errorDetails : JSON.stringify(errorDetails),
      statusCode
    );
    revalidatePath('/'); // Revalidate dashboard to show new log
  } catch (dbError) {
    console.error('Failed to log API request error to DB:', dbError);
  }
};

// Define the schema for individual readings within the payload
const ReadingSchema = z.object({
  channel: z.coerce.number().int().min(1, "Channel must be 1-8").max(8, "Channel must be 1-8"),
  type: z.enum(SENSOR_TYPES_ARRAY, {
    errorMap: (issue, ctx) => ({ message: `Invalid sensor type. Expected one of: ${SENSOR_TYPES_ARRAY.join(', ')} (PascalCase). Received: ${ctx.data}` })
  }),
  value: z.number(),
});

// Define the schema for the entire POST payload
const IngestPayloadSchema = z.object({
  device_id: z.string().min(1, "device_id is required"), // This is the userVisibleId of the device
  timestamp: z.string().datetime({ message: "Invalid timestamp format. Expected ISO 8601 datetime string." }), // ISO 8601 format
  readings: z.array(ReadingSchema).min(1, "At least one reading is required"),
});

export async function POST(request: NextRequest) {
  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    const errorMessage = 'Invalid JSON payload.';
    logFailedRequest(request, null, 'Invalid JSON', errorMessage, 400);
    return NextResponse.json({ success: false, message: errorMessage }, { status: 400 });
  }

  const validation = IngestPayloadSchema.safeParse(payload);

  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    logFailedRequest(request, payload, 'Validation Error', errors, 400, payload.device_id);
    return NextResponse.json({ success: false, message: 'Validation failed.', errors: errors }, { status: 400 });
  }

  const { device_id: userVisibleId, timestamp: batchTimestamp, readings } = validation.data;

  try {
    // Find the device by its userVisibleId
    const deviceStmt = db.prepare('SELECT id FROM devices WHERE userVisibleId = ?');
    const device = deviceStmt.get(userVisibleId) as { id: string } | undefined;

    if (!device) {
      const errorMessage = `Device with userVisibleId '${userVisibleId}' not found.`;
      logFailedRequest(request, payload, 'Device Not Found', errorMessage, 404, userVisibleId);
      return NextResponse.json({ success: false, message: errorMessage }, { status: 404 });
    }
    const internalDeviceId = device.id;

    let readingsProcessed = 0;
    let errorsEncountered: { channel: number, type: string, message: string }[] = [];

    for (const reading of readings) {
      // Find the sensor by deviceId and channel
      const sensorStmt = db.prepare('SELECT id, type FROM sensors WHERE deviceId = ? AND channel = ?');
      const sensor = sensorStmt.get(internalDeviceId, reading.channel) as { id: string, type: string } | undefined;

      if (!sensor) {
        errorsEncountered.push({ channel: reading.channel, type: reading.type, message: `Sensor not found on device '${userVisibleId}' for channel ${reading.channel}.` });
        continue;
      }

      if (sensor.type !== reading.type) {
         errorsEncountered.push({ channel: reading.channel, type: reading.type, message: `Type mismatch for channel ${reading.channel}. Expected '${sensor.type}', got '${reading.type}'.` });
        continue;
      }

      const sensorId = sensor.id;

      // Insert into sensor_readings
      const insertReadingStmt = db.prepare('INSERT INTO sensor_readings (sensorId, timestamp, value) VALUES (?, ?, ?)');
      insertReadingStmt.run(sensorId, batchTimestamp, reading.value);

      // Update sensors table with the latest value and timestamp
      const updateSensorStmt = db.prepare('UPDATE sensors SET currentValue = ?, lastTimestamp = ? WHERE id = ?');
      updateSensorStmt.run(reading.value, batchTimestamp, sensorId);
      
      readingsProcessed++;
    }

    if (readingsProcessed > 0) {
      revalidatePath('/');
      revalidatePath('/sensors');
      revalidatePath('/charts');
    }

    if (errorsEncountered.length > 0) {
      const status = readingsProcessed > 0 ? 207 : 400; // 207 Multi-Status if partially successful
      logFailedRequest(request, payload, 'Partial Ingestion Error', errorsEncountered, status, userVisibleId);
      return NextResponse.json({ 
        success: readingsProcessed > 0, 
        message: `Processed ${readingsProcessed} out of ${readings.length} readings. Some errors occurred.`,
        errors: errorsEncountered 
      }, { status });
    }

    return NextResponse.json({ success: true, message: `Successfully processed ${readingsProcessed} readings for device '${userVisibleId}'.` }, { status: 201 });

  } catch (error: any) {
    console.error('API - Failed to ingest sensor readings:', error);
    const errorMessage = 'An internal server error occurred.';
    logFailedRequest(request, payload, 'Internal Server Error', error.message || errorMessage, 500, userVisibleId);
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}
