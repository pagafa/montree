
'use server';

import { db } from '@/lib/db';
import type { SensorReading } from '@/types'; // Assuming SensorReading is { timestamp: string, value: number }
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { format } from 'date-fns';

const addReadingSchema = z.object({
  sensorId: z.string().min(1, "Sensor ID is required"),
  value: z.coerce.number(),
});

// This action is more for backend data ingestion, but useful for updating sensor's current state
export async function addSensorReading(sensorId: string, value: number): Promise<{ success: boolean; message?: string }> {
  const validation = addReadingSchema.safeParse({ sensorId, value });
  if (!validation.success) {
    return { success: false, message: validation.error.errors[0].message };
  }

  const { sensorId: validatedSensorId, value: validatedValue } = validation.data;
  const timestamp = new Date().toISOString();

  try {
    const addReadingStmt = db.prepare('INSERT INTO sensor_readings (sensorId, timestamp, value) VALUES (?, ?, ?)');
    addReadingStmt.run(validatedSensorId, timestamp, validatedValue);

    const updateSensorStmt = db.prepare('UPDATE sensors SET currentValue = ?, lastTimestamp = ? WHERE id = ?');
    updateSensorStmt.run(validatedValue, timestamp, validatedSensorId);
    
    revalidatePath('/'); // Revalidate dashboard
    revalidatePath('/sensors'); // Revalidate sensors list page
    revalidatePath(`/charts`); // Revalidate charts page if it shows latest value or could be affected

    return { success: true };
  } catch (error: any) {
    console.error('Failed to add sensor reading:', error);
    return { success: false, message: 'Failed to add sensor reading. Please try again.' };
  }
}

export async function getSensorReadings(sensorId: string, limit: number = 24): Promise<SensorReading[]> {
  if (!sensorId) return [];
  try {
    const stmt = db.prepare(
      'SELECT timestamp, value FROM sensor_readings WHERE sensorId = ? ORDER BY timestamp DESC LIMIT ?'
    );
    const rawReadings = stmt.all(sensorId, limit) as { timestamp: string; value: number }[];
    
    // Reverse to have oldest first for charting and format timestamp
    return rawReadings.reverse().map(r => ({
      timestamp: format(new Date(r.timestamp), 'HH:mm'), // Format for chart display
      value: r.value
    }));
  } catch (error) {
    console.error(`Failed to fetch readings for sensor ${sensorId}:`, error);
    return [];
  }
}
