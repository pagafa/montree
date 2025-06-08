
export interface SensorData {
  id: string;
  name: string;
  type: 'Temperature' | 'Humidity' | 'Pressure' | 'Light' | 'Motion' | 'Generic' | 'CO2';
  channel: number;
  value: number | null; // Mapped from currentValue, can be null if no reading yet
  unit: string;
  timestamp: Date | null; // Mapped from lastTimestamp, can be null
  deviceId: string; // Changed from 'device' to 'deviceId'
}

export interface DisplayConfig {
  theme: 'light' | 'dark' | 'system';
  // Add other configuration options here
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
  deviceId: string;
  currentValue: number | null;
  lastTimestamp: string | null; // ISO 8601 string
}
