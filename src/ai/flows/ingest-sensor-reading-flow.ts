'use server';
/**
 * @fileOverview A Genkit flow for ingesting sensor readings.
 *
 * - ingestSensorReading - A function that handles the ingestion of a single sensor reading.
 * - IngestSensorReadingInput - The input type for the ingestSensorReading function.
 * - IngestSensorReadingOutput - The return type for the ingestSensorReading function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { SENSOR_TYPES_ARRAY } from '@/lib/mock-data'; // Re-use existing sensor types

const IngestSensorReadingInputSchema = z.object({
  deviceId: z.string().describe("The user-visible ID of the device sending the data."),
  sensorName: z.string().describe("The name of the sensor on the device."),
  sensorType: z.enum(SENSOR_TYPES_ARRAY).describe("The type of the sensor."),
  value: z.number().describe("The reading value from the sensor."),
  unit: z.string().describe("The unit of measurement for the sensor value."),
  timestamp: z.string().datetime().optional().describe("ISO 8601 timestamp of when the reading was taken. If not provided, current server time can be assumed."),
});
export type IngestSensorReadingInput = z.infer<typeof IngestSensorReadingInputSchema>;

const IngestSensorReadingOutputSchema = z.object({
  status: z.string().describe("The status of the ingestion (e.g., 'success', 'error')."),
  message: z.string().describe("A message describing the result of the ingestion."),
  receivedData: IngestSensorReadingInputSchema.optional().describe("The data that was received by the flow, echoed back for confirmation or debugging."),
});
export type IngestSensorReadingOutput = z.infer<typeof IngestSensorReadingOutputSchema>;

export async function ingestSensorReading(input: IngestSensorReadingInput): Promise<IngestSensorReadingOutput> {
  return ingestSensorReadingFlow(input);
}

const ingestSensorReadingFlow = ai.defineFlow(
  {
    name: 'ingestSensorReadingFlow',
    inputSchema: IngestSensorReadingInputSchema,
    outputSchema: IngestSensorReadingOutputSchema,
  },
  async (input) => {
    console.log('Received sensor reading:', JSON.stringify(input, null, 2));

    // In a real application, you would:
    // 1. Validate the deviceId and sensorName/sensorType against a database.
    // 2. Store the reading (input.value, input.timestamp, etc.) in a time-series database.
    // 3. Potentially trigger alerts or other actions based on the reading.

    // For this prototype, we just simulate success.
    return {
      status: 'success',
      message: `Successfully received reading for sensor '${input.sensorName}' on device '${input.deviceId}'.`,
      receivedData: input,
    };
  }
);
