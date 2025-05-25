
export interface SensorData {
  id: string;
  name: string;
  type: 'Temperature' | 'Humidity' | 'Pressure' | 'Light' | 'Motion' | 'Generic';
  value: number;
  unit: string;
  timestamp: Date;
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
