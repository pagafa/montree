export interface SensorData {
  id: string;
  name: string;
  type: 'Temperature' | 'Humidity' | 'Pressure' | 'Light' | 'Motion' | 'Generic';
  value: number;
  unit: string;
  timestamp: Date;
  location: string;
  status: 'active' | 'inactive' | 'error';
}

export interface SensorReading {
  timestamp: string; // Store as string for chart compatibility e.g. "HH:mm:ss" or "MMM dd"
  value: number;
}

export interface DisplayConfig {
  theme: 'light' | 'dark' | 'system';
  // Add other configuration options here
}
