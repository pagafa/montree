
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { SENSOR_TYPES_ARRAY } from '@/lib/mock-data'; // Using existing array for type validation
import { revalidatePath } from 'next/cache';

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
    return NextResponse.json({ success: false, message: 'Invalid JSON payload.' }, { status: 400 });
  }

  const validation = IngestPayloadSchema.safeParse(payload);

  if (!validation.success) {
    return NextResponse.json({ success: false, message: 'Validation failed.', errors: validation.error.flatten().fieldErrors }, { status: 400 });
  }

  const { device_id: userVisibleId, timestamp: batchTimestamp, readings } = validation.data;

  try {
    // Find the device by its userVisibleId
    const deviceStmt = db.prepare('SELECT id FROM devices WHERE userVisibleId = ?');
    const device = deviceStmt.get(userVisibleId) as { id: string } | undefined;

    if (!device) {
      return NextResponse.json({ success: false, message: `Device with userVisibleId '${userVisibleId}' not found.` }, { status: 404 });
    }
    const internalDeviceId = device.id;

    let readingsProcessed = 0;
    let errors: { channel: number, type: string, message: string }[] = [];

    // Use a transaction to ensure all readings are processed or none are (if a critical error occurs)
    // However, for simplicity here, we'll process one by one and report partial success/failures.
    // A more robust implementation would use db.transaction(() => { ... })();

    for (const reading of readings) {
      // Find the sensor by deviceId and channel
      const sensorStmt = db.prepare('SELECT id, type FROM sensors WHERE deviceId = ? AND channel = ?');
      const sensor = sensorStmt.get(internalDeviceId, reading.channel) as { id: string, type: string } | undefined;

      if (!sensor) {
        errors.push({ channel: reading.channel, type: reading.type, message: `Sensor not found on device '${userVisibleId}' for channel ${reading.channel}.` });
        continue;
      }

      // Optional: Validate if the type in the payload matches the registered sensor type.
      // The schema already validates if the type is a *known* sensor type.
      // This check ensures it's the *expected* type for that specific channel.
      if (sensor.type !== reading.type) {
         errors.push({ channel: reading.channel, type: reading.type, message: `Type mismatch for channel ${reading.channel}. Expected '${sensor.type}', got '${reading.type}'.` });
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
      // Revalidate paths to update UI
      revalidatePath('/');        // Dashboard page
      revalidatePath('/sensors'); // Sensors list page
      revalidatePath('/charts');  // Charts page (shows latest value or could be affected)
    }

    if (errors.length > 0) {
      return NextResponse.json({ 
        success: readingsProcessed > 0, // True if at least one reading was processed
        message: `Processed ${readingsProcessed} out of ${readings.length} readings. Some errors occurred.`,
        errors: errors 
      }, { status: readingsProcessed > 0 ? 207 : 400 }); // 207 Multi-Status if partially successful
    }

    return NextResponse.json({ success: true, message: `Successfully processed ${readingsProcessed} readings for device '${userVisibleId}'.` }, { status: 201 });

  } catch (error: any) {
    console.error('API - Failed to ingest sensor readings:', error);
    return NextResponse.json({ success: false, message: 'An internal server error occurred.' }, { status: 500 });
  }
}
