
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
    revalidatePath('/'); 
  } catch (dbError) {
    console.error('Failed to log API request error to DB:', dbError);
  }
};

// Define the schema for individual metrics within a reading from the payload
const MetricReadingSchema = z.object({
  channel: z.coerce.number().int().min(1, "Channel must be 1-8").max(8, "Channel must be 1-8"),
  iso_timestamp: z.string().datetime({ message: "Invalid iso_timestamp format for reading. Expected ISO 8601 datetime string." }),
  timestamp: z.number().optional(), // Numeric timestamp from payload
  sensor_type: z.coerce.number().int().optional(), // e.g., 2 for "SCD30"
  temperature: z.number().optional(),
  humidity: z.number().optional(),
  co2: z.number().optional(),
  // Add other potential metrics here, e.g.:
  // pressure: z.number().optional(),
  // light_level: z.number().optional(),
});

// Define the schema for the entire POST payload
const IngestPayloadSchema = z.object({
  device_id: z.string().min(1, "device_id is required"), // This is the userVisibleId of the device
  iso_timestamp: z.string().datetime({ message: "Invalid root iso_timestamp format. Expected ISO 8601 datetime string." }),
  timestamp: z.number().optional(), // Numeric root timestamp from payload
  time_synchronized: z.boolean().optional(), // time_synchronized from payload
  readings: z.array(MetricReadingSchema).min(1, "At least one reading object is required"),
});

// Helper to map payload keys to sensor types and units
const METRIC_TO_SENSOR_TYPE_MAP: Record<string, { type: (typeof SENSOR_TYPES_ARRAY)[number], defaultUnit: string }> = {
  temperature: { type: 'Temperature', defaultUnit: '°C' },
  humidity: { type: 'Humidity', defaultUnit: '%' },
  co2: { type: 'CO2', defaultUnit: 'ppm' },
  // pressure: { type: 'Pressure', defaultUnit: 'hPa' },
  // light_level: { type: 'Light', defaultUnit: 'lux' },
};

export async function POST(request: NextRequest) {
  let payload;
  let userVisibleIdFromPayload: string | undefined = undefined;
  try {
    payload = await request.json();
    userVisibleIdFromPayload = payload?.device_id;
  } catch (error) {
    const errorMessage = 'Invalid JSON payload. Please ensure the request body is a well-formed JSON object.';
    logFailedRequest(request, null, 'Invalid JSON', errorMessage, 400);
    return NextResponse.json({ success: false, message: errorMessage }, { status: 400 });
  }

  const validation = IngestPayloadSchema.safeParse(payload);

  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    const errorMessage = 'Payload validation failed. Please check the structure and data types of your request.';
    logFailedRequest(request, payload, 'Validation Error', errors, 400, userVisibleIdFromPayload);
    return NextResponse.json({ success: false, message: errorMessage, errors: errors }, { status: 400 });
  }

  const { device_id: userVisibleId, readings } = validation.data;

  try {
    const deviceStmt = db.prepare('SELECT id FROM devices WHERE userVisibleId = ?');
    const device = deviceStmt.get(userVisibleId) as { id: string } | undefined;

    if (!device) {
      const errorMessage = `Device with userVisibleId '${userVisibleId}' not found. Please ensure the device is registered.`;
      logFailedRequest(request, payload, 'Device Not Found', errorMessage, 404, userVisibleId);
      return NextResponse.json({ success: false, message: errorMessage }, { status: 404 });
    }
    const internalDeviceId = device.id;

    let metricsProcessed = 0;
    let totalMetricsAttempted = 0;
    let errorsEncountered: { channel: number, metric: string, value?: number, message: string }[] = [];

    for (const reading of readings) {
      const { channel, iso_timestamp: readingTimestamp, temperature, humidity, co2 } = reading;
      
      const currentMetricsToProcess: Record<string, number | undefined> = { temperature, humidity, co2 };

      for (const metricKey in currentMetricsToProcess) {
        if (Object.prototype.hasOwnProperty.call(currentMetricsToProcess, metricKey) && METRIC_TO_SENSOR_TYPE_MAP[metricKey]) {
          totalMetricsAttempted++;
          const metricValue = currentMetricsToProcess[metricKey];
          const sensorTypeInfo = METRIC_TO_SENSOR_TYPE_MAP[metricKey];

          if (metricValue === undefined || metricValue === null) continue;

          const sensorStmt = db.prepare('SELECT id, type, unit FROM sensors WHERE deviceId = ? AND channel = ? AND type = ?');
          const sensor = sensorStmt.get(internalDeviceId, channel, sensorTypeInfo.type) as { id: string, type: string, unit: string } | undefined;

          if (!sensor) {
            errorsEncountered.push({ channel, metric: metricKey, value: metricValue, message: `Sensor for type '${sensorTypeInfo.type}' (metric key '${metricKey}') not found on device '${userVisibleId}' for channel ${channel}. Ensure a sensor of this type is registered for this channel and device.` });
            continue;
          }

          const sensorId = sensor.id;

          try {
            const insertReadingStmt = db.prepare('INSERT INTO sensor_readings (sensorId, timestamp, value) VALUES (?, ?, ?)');
            insertReadingStmt.run(sensorId, readingTimestamp, metricValue);

            const updateSensorStmt = db.prepare('UPDATE sensors SET currentValue = ?, lastTimestamp = ? WHERE id = ?');
            updateSensorStmt.run(metricValue, readingTimestamp, sensorId);
            
            metricsProcessed++;
          } catch (dbOpError: any) {
             errorsEncountered.push({ channel, metric: metricKey, value: metricValue, message: `Database error processing metric '${metricKey}' for sensor type '${sensorTypeInfo.type}' on channel ${channel}: ${dbOpError.message}` });
          }
        }
      }
    }

    if (metricsProcessed > 0) {
      revalidatePath('/');
      revalidatePath('/sensors');
      revalidatePath('/charts');
    }

    if (errorsEncountered.length > 0) {
      const status = metricsProcessed > 0 ? 207 : 400; 
      const message = `Processed ${metricsProcessed} out of ${totalMetricsAttempted} attempted metrics for device '${userVisibleId}'. ${errorsEncountered.length > 0 ? `${errorsEncountered.length} errors occurred.` : ''}`;
      logFailedRequest(request, payload, 'Partial Ingestion Error / Metric Error', errorsEncountered, status, userVisibleId);
      return NextResponse.json({ 
        success: metricsProcessed > 0, 
        message: message,
        processed_metrics: metricsProcessed,
        attempted_metrics: totalMetricsAttempted,
        errors: errorsEncountered 
      }, { status });
    }
    
    if (totalMetricsAttempted === 0 && readings.length > 0) {
        const message = "Payload received, but no recognizable or supported metrics (e.g., 'temperature', 'humidity', 'co2') were found in the 'readings' array, or the metrics provided had no values.";
        logFailedRequest(request, payload, 'No Valid Metrics', message, 400, userVisibleId);
        return NextResponse.json({ success: false, message: message }, { status: 400 });
    }

    return NextResponse.json({ 
        success: true, 
        message: `Successfully processed ${metricsProcessed} metrics for device '${userVisibleId}'.`,
        processed_metrics: metricsProcessed,
        attempted_metrics: totalMetricsAttempted
    }, { status: 201 });

  } catch (error: any) {
    console.error('API - Failed to ingest sensor readings:', error);
    const errorMessage = 'An unexpected internal server error occurred. Please try again later or contact support if the issue persists.';
    logFailedRequest(request, payload, 'Internal Server Error', error.message || 'Error details not available.', 500, userVisibleIdFromPayload || (payload && payload.device_id));
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}
