
'use server';

import { db } from '@/lib/db';
import type { ManagedDevice } from '@/types';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const deviceSchema = z.object({
  userVisibleId: z.string().min(1, "Device ID is required"),
  name: z.string().min(1, "Device name is required"),
});

export async function getDevices(): Promise<ManagedDevice[]> {
  try {
    const stmt = db.prepare('SELECT id, userVisibleId, name FROM devices ORDER BY name COLLATE NOCASE ASC');
    const devices = stmt.all() as ManagedDevice[];
    return devices;
  } catch (error) {
    console.error('Failed to fetch devices:', error);
    return [];
  }
}

export async function addDevice(data: { userVisibleId: string; name: string }): Promise<{ success: boolean; message?: string; device?: ManagedDevice, errorField?: 'userVisibleId' | 'name' }> {
  const validation = deviceSchema.safeParse(data);
  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return { success: false, message: firstError.message, errorField: firstError.path[0] as 'userVisibleId' | 'name' };
  }

  const { userVisibleId, name } = validation.data;
  const id = crypto.randomUUID();

  try {
    const stmt = db.prepare('INSERT INTO devices (id, userVisibleId, name) VALUES (?, ?, ?)');
    stmt.run(id, userVisibleId, name);
    revalidatePath('/devices');
    revalidatePath('/sensors'); // In case sensor page uses device list
    revalidatePath('/charts');  // In case chart page uses device list
    return { success: true, device: { id, userVisibleId, name } };
  } catch (error: any) {
    console.error('Failed to add device:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return { success: false, message: 'Device ID already exists. Please use a unique ID.', errorField: 'userVisibleId' };
    }
    return { success: false, message: 'Failed to add device. Please try again.' };
  }
}

export async function updateDevice(id: string, data: { userVisibleId: string; name: string }): Promise<{ success: boolean; message?: string; device?: ManagedDevice, errorField?: 'userVisibleId' | 'name' }> {
  const validation = deviceSchema.safeParse(data);
  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return { success: false, message: firstError.message, errorField: firstError.path[0] as 'userVisibleId' | 'name' };
  }

  const { userVisibleId, name } = validation.data;

  try {
    const stmt = db.prepare('UPDATE devices SET userVisibleId = ?, name = ? WHERE id = ?');
    const result = stmt.run(userVisibleId, name, id);
    if (result.changes === 0) {
      return { success: false, message: 'Device not found or no changes made.' };
    }
    revalidatePath('/devices');
    revalidatePath('/sensors');
    revalidatePath('/charts');
    return { success: true, device: { id, userVisibleId, name } };
  } catch (error: any) {
    console.error('Failed to update device:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return { success: false, message: 'Device ID already exists. Please use a unique ID.', errorField: 'userVisibleId' };
    }
    return { success: false, message: 'Failed to update device. Please try again.' };
  }
}

export async function deleteDevice(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    // Future enhancement: Check if device has associated sensors and handle accordingly (e.g., prevent deletion or cascade)
    // For now, we rely on 'ON DELETE CASCADE' for sensors linked to this device.
    const stmt = db.prepare('DELETE FROM devices WHERE id = ?');
    const result = stmt.run(id);
    if (result.changes === 0) {
      return { success: false, message: 'Device not found.' };
    }
    revalidatePath('/devices');
    revalidatePath('/sensors');
    revalidatePath('/charts');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete device:', error);
    return { success: false, message: 'Failed to delete device. Please try again.' };
  }
}
