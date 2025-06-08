
'use server';

import { db } from '@/lib/db';
import type { DBSensor } from '@/types';
import { SENSOR_TYPES_ARRAY } from '@/lib/mock-data'; // For enum validation
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { addSensorReading } from '@/app/readings/actions'; // Import for adding initial reading

// Zod schema for adding a sensor (input from form)
const addSensorFormSchema = z.object({
  name: z.string().min(1, "Sensor name is required"),
  type: z.enum(SENSOR_TYPES_ARRAY),
  channel: z.coerce.number().int().min(1, "Channel must be between 1 and 8").max(8, "Channel must be between 1 and 8"),
  unit: z.string().min(1, "Unit is required"), // Will be derived from type but validated
  deviceId: z.string().min(1, "Device assignment is required"),
  initialValue: z.coerce.number().nullable().default(null), // Optional initial value for the sensor
});
export type AddSensorFormData = z.infer<typeof addSensorFormSchema>;

// Zod schema for updating a sensor (input from form)
const updateSensorFormSchema = z.object({
  name: z.string().min(1, "Sensor name is required"),
  type: z.enum(SENSOR_TYPES_ARRAY),
  channel: z.coerce.number().int().min(1).max(8),
  unit: z.string().min(1, "Unit is required"),
  deviceId: z.string().min(1, "Device assignment is required"),
});
export type UpdateSensorFormData = z.infer<typeof updateSensorFormSchema>;


export async function getSensors(): Promise<DBSensor[]> {
  try {
    const stmt = db.prepare('SELECT id, name, type, channel, unit, deviceId, currentValue, lastTimestamp FROM sensors ORDER BY deviceId, name COLLATE NOCASE ASC');
    const sensors = stmt.all() as DBSensor[];
    return sensors;
  } catch (error) {
    console.error('Failed to fetch sensors:', error);
    return [];
  }
}

export async function addSensor(data: AddSensorFormData): Promise<{ success: boolean; message?: string; sensor?: DBSensor, errorField?: keyof AddSensorFormData }> {
  const validation = addSensorFormSchema.safeParse(data);
  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return { success: false, message: firstError.message, errorField: firstError.path[0] as keyof AddSensorFormData };
  }

  const { name, type, channel, unit, deviceId, initialValue } = validation.data;
  const id = crypto.randomUUID();
  const lastTimestamp = initialValue !== null ? new Date().toISOString() : null;

  try {
    // Check if deviceId exists
    const deviceExistsStmt = db.prepare('SELECT id FROM devices WHERE id = ?');
    const device = deviceExistsStmt.get(deviceId);
    if (!device) {
      return { success: false, message: 'Selected device does not exist.', errorField: 'deviceId' };
    }

    const stmt = db.prepare('INSERT INTO sensors (id, name, type, channel, unit, deviceId, currentValue, lastTimestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    stmt.run(id, name, type, channel, unit, deviceId, initialValue, lastTimestamp);
    
    const newSensor: DBSensor = { id, name, type, channel, unit, deviceId, currentValue: initialValue, lastTimestamp };

    // If an initial value is provided, add it to the sensor_readings table
    if (initialValue !== null) {
      await addSensorReading(id, initialValue); // This already handles revalidation
    } else {
      revalidatePath('/sensors');
      revalidatePath('/'); // For dashboard summary
      revalidatePath('/charts'); // Sensor list might be used here too
    }
    
    return { success: true, sensor: newSensor };
  } catch (error: any) {
    console.error('Failed to add sensor:', error);
    return { success: false, message: 'Failed to add sensor. Please try again.' };
  }
}

export async function updateSensor(id: string, data: UpdateSensorFormData): Promise<{ success: boolean; message?: string; sensor?: DBSensor, errorField?: keyof UpdateSensorFormData }> {
  const validation = updateSensorFormSchema.safeParse(data);
  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return { success: false, message: firstError.message, errorField: firstError.path[0] as keyof UpdateSensorFormData };
  }

  const { name, type, channel, unit, deviceId } = validation.data;

  try {
    const deviceExistsStmt = db.prepare('SELECT id FROM devices WHERE id = ?');
    const device = deviceExistsStmt.get(deviceId);
    if (!device) {
      return { success: false, message: 'Selected device does not exist.', errorField: 'deviceId' };
    }

    const stmt = db.prepare('UPDATE sensors SET name = ?, type = ?, channel = ?, unit = ?, deviceId = ? WHERE id = ?');
    const result = stmt.run(name, type, channel, unit, deviceId, id);

    if (result.changes === 0) {
      return { success: false, message: 'Sensor not found or no changes made.' };
    }
    revalidatePath('/sensors');
    revalidatePath('/');
    revalidatePath('/charts');
    const updatedSensorStmt = db.prepare('SELECT id, name, type, channel, unit, deviceId, currentValue, lastTimestamp FROM sensors WHERE id = ?');
    const updatedSensor = updatedSensorStmt.get(id) as DBSensor;
    return { success: true, sensor: updatedSensor };
  } catch (error: any) {
    console.error('Failed to update sensor:', error);
    return { success: false, message: 'Failed to update sensor. Please try again.' };
  }
}

export async function deleteSensor(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const stmt = db.prepare('DELETE FROM sensors WHERE id = ?');
    const result = stmt.run(id);
    if (result.changes === 0) {
      return { success: false, message: 'Sensor not found.' };
    }
    revalidatePath('/sensors');
    revalidatePath('/');
    revalidatePath('/charts');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete sensor:', error);
    return { success: false, message: 'Failed to delete sensor. Please try again.' };
  }
}

