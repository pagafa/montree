import type { SensorData } from '@/types'; // Removed SensorReading import
import { subMinutes } from 'date-fns'; // Removed format import

const SENSOR_NAMES = [
  'Alpha-001', 'Bravo-007', 'Charlie-113', 'Delta-224', 'Echo-5', 
  'Foxtrot-99', 'Golf-747', 'Hotel-California', 'India-One', 'Juliet-Rose'
];
const SENSOR_TYPES: SensorData['type'][] = ['Temperature', 'Humidity', 'Pressure', 'Light', 'Motion', 'Generic'];
const LOCATIONS = ['Server Room A', 'Lobby', 'Warehouse Section 3', 'Office 201', 'Rooftop Unit'];
const UNITS: { [key in SensorData['type']]: string } = {
  Temperature: '°C',
  Humidity: '%',
  Pressure: 'hPa',
  Light: 'lux',
  Motion: 'detections',
  Generic: 'units'
};

export function generateSensorData(count: number): SensorData[] {
  const data: SensorData[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const type = SENSOR_TYPES[i % SENSOR_TYPES.length];
    data.push({
      id: `sensor-${i + 1}`,
      name: SENSOR_NAMES[i % SENSOR_NAMES.length],
      type,
      value: parseFloat((Math.random() * 100).toFixed(2)),
      unit: UNITS[type],
      timestamp: subMinutes(now, Math.floor(Math.random() * 60)),
      location: LOCATIONS[i % LOCATIONS.length],
    });
  }
  return data;
}

// generateHistoricalData function removed as it's no longer used
