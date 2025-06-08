
export interface SensorData {
  id: string;
  name: string;
  type: 'Temperature' | 'Humidity' | 'Pressure' | 'Light' | 'Motion' | 'Generic' | 'CO2';
  channel: number;
  value: number | null; // Mapped from currentValue, can be null if no reading yet
  unit: string;
  timestamp: Date | null; // Mapped from lastTimestamp, can be null
  deviceId: string; // System ID of the device
}

// For managing devices on the devices page
export interface ManagedDevice {
  id: string; // System-generated, immutable UUID
  userVisibleId: string; // User-editable identifier, labeled as "Device ID" in UI
  name: string;
}

// For displaying historical sensor readings in charts
export interface SensorReading {
  timestamp: string; // Formatted time string, e.g., "HH:mm"
  value: number;
}

// Represents a sensor as stored in the database
export interface DBSensor {
  id: string;
  name: string;
  type: SensorData['type'];
  channel: number;
  unit: string;
  deviceId: string; // System ID of the device
  currentValue: number | null;
  lastTimestamp: string | null; // ISO 8601 string
}

// Represents a log entry for an API request
export interface ApiRequestLog {
  id: number;
  timestamp: string; // ISO 8601 string
  ip_address: string | null;
  method: string;
  path: string;
  device_id_attempted: string | null;
  payload_received: string | null;
  error_type: string;
  error_details: string | null;
  status_code_returned: number;
}
