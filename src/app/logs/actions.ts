
'use server';

import { db } from '@/lib/db';
import type { ApiRequestLog } from '@/types';
import { revalidatePath } from 'next/cache';

/**
 * Fetches the most recent API request logs from the database.
 * @param limit The maximum number of log entries to retrieve. Defaults to 20.
 * @returns A promise that resolves to an array of ApiRequestLog objects.
 */
export async function getApiRequestLogs(limit: number = 20): Promise<ApiRequestLog[]> {
  try {
    const stmt = db.prepare(
      'SELECT id, timestamp, ip_address, method, path, device_id_attempted, payload_received, error_type, error_details, status_code_returned FROM api_request_logs ORDER BY timestamp DESC LIMIT ?'
    );
    const logs = stmt.all(limit) as ApiRequestLog[];
    return logs;
  } catch (error) {
    console.error('Failed to fetch API request logs:', error);
    return [];
  }
}

/**
 * Deletes all API request logs from the database.
 * @returns A promise that resolves to an object indicating success or failure.
 */
export async function clearApiRequestLogs(): Promise<{ success: boolean; message?: string }> {
    try {
        const stmt = db.prepare('DELETE FROM api_request_logs');
        stmt.run();
        revalidatePath('/'); // Revalidate dashboard to clear logs
        return { success: true, message: 'All API request logs have been cleared.' };
    } catch (error: any) {
        console.error('Failed to clear API request logs:', error);
        return { success: false, message: 'Failed to clear API request logs. Please try again.' };
    }
}
