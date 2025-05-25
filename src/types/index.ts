export interface SensorData {
  id: string;
  name: string;
  type: 'Temperature' | 'Humidity' | 'Pressure' | 'Light' | 'Motion' | 'Generic';
  value: number;
  unit: string;
  timestamp: Date;
  device: string; // Changed from location to device
}

export interface DisplayConfig {
  theme: 'light' | 'dark' | 'system';
  // Add other configuration options here
}
