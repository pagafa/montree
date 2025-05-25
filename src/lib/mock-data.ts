import type { SensorData, SensorReading } from '@/types';
import { subMinutes, format } from 'date-fns';

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

export function generateHistoricalData(sensorId: string, points: number): SensorReading[] {
  const data: SensorReading[] = [];
  const now = new Date();
  let currentValue = Math.random() * 50 + 25; // Start with a baseline value

  for (let i = 0; i < points; i++) {
    const timestamp = subMinutes(now, (points - 1 - i) * 5); // Data points every 5 minutes
    currentValue += (Math.random() - 0.5) * 5; // Fluctuate value
    currentValue = Math.max(0, Math.min(100, currentValue)); // Clamp between 0 and 100

    data.push({
      timestamp: format(timestamp, 'HH:mm'), // Format for XAxis display
      value: parseFloat(currentValue.toFixed(2)),
    });
  }
  return data;
}
