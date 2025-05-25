
export interface SensorData {
  id: string;
  name: string;
  type: 'Temperature' | 'Humidity' | 'Pressure' | 'Light' | 'Motion' | 'Generic';
  value: number; // Current/last known value, used for 'add sensor' form
  unit: string;  // Unit corresponding to the type, used for 'add sensor' form
  timestamp: Date; // Last update timestamp
  device: string;
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
