
'use server';
/**
 * @fileOverview A Genkit flow for ingesting a batch of sensor readings from a device.
 *
 * - ingestSensorReading - A function that handles the ingestion of multiple sensor readings.
 * - IngestBatchReadingsInput - The input type for the ingestSensorReading function.
 * - IngestBatchReadingsOutput - The return type for the ingestSensorReading function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { SENSOR_TYPES_ARRAY } from '@/lib/mock-data'; // Re-use existing sensor types

const IndividualReadingSchema = z.object({
  channel: z.number().optional().describe("The channel ID of the sensor on the device."),
  type: z.enum(SENSOR_TYPES_ARRAY).describe("The type of the sensor (e.g., 'Temperature', 'CO2', 'Light'). Must match defined system types."),
  value: z.number().describe("The reading value from the sensor."),
});

const IngestBatchReadingsInputSchema = z.object({
  device_id: z.string().describe("The unique identifier of the device sending the data."),
  timestamp: z.string().datetime().describe("ISO 8601 timestamp of when the readings were taken."),
  readings: z.array(IndividualReadingSchema).min(1).describe("An array of sensor readings from the device."),
});
export type IngestBatchReadingsInput = z.infer<typeof IngestBatchReadingsInputSchema>;

const IngestBatchReadingsOutputSchema = z.object({
  status: z.string().describe("The status of the ingestion (e.g., 'success', 'error')."),
  message: z.string().describe("A message describing the result of the ingestion."),
  deviceIdReceived: z.string().optional().describe("The device ID for which readings were processed."),
  readingsProcessed: z.number().optional().describe("The number of readings processed from the batch."),
});
export type IngestBatchReadingsOutput = z.infer<typeof IngestBatchReadingsOutputSchema>;

// Keeping the exported function name as ingestSensorReading for now to maintain compatibility
// with dev.ts, but the input type has changed to reflect batch processing.
export async function ingestSensorReading(input: IngestBatchReadingsInput): Promise<IngestBatchReadingsOutput> {
  return ingestSensorReadingFlow(input);
}

const ingestSensorReadingFlow = ai.defineFlow(
  {
    name: 'ingestSensorReadingFlow', // Name of the flow itself
    inputSchema: IngestBatchReadingsInputSchema,
    outputSchema: IngestBatchReadingsOutputSchema,
  },
  async (input) => {
    console.log('Received batch sensor readings for device:', input.device_id);
    console.log('Timestamp:', input.timestamp);
    console.log('Number of readings in batch:', input.readings.length);
    input.readings.forEach((reading, index) => {
      console.log(`Reading ${index + 1}: Channel: ${reading.channel ?? 'N/A'}, Type: ${reading.type}, Value: ${reading.value}`);
    });

    // In a real application, you would:
    // 1. Validate the device_id against a database of registered devices.
    // 2. For each reading in input.readings:
    //    a. Validate sensor type and channel if necessary.
    //    b. Store the reading (value, type, channel, input.timestamp) in a time-series database, associated with input.device_id.
    // 3. Potentially trigger alerts or other actions based on the readings.

    // For this prototype, we just simulate success.
    return {
      status: 'success',
      message: `Successfully received ${input.readings.length} readings for device '${input.device_id}'.`,
      deviceIdReceived: input.device_id,
      readingsProcessed: input.readings.length,
    };
  }
);
