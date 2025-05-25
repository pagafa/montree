import type { SensorData } from '@/types';
import { subMinutes } from 'date-fns';

const SENSOR_NAMES = [
  'Alpha-001', 'Bravo-007', 'Charlie-113', 'Delta-224', 'Echo-5', 
  'Foxtrot-99', 'Golf-747', 'Hotel-California', 'India-One', 'Juliet-Rose'
];
const SENSOR_TYPES: SensorData['type'][] = ['Temperature', 'Humidity', 'Pressure', 'Light', 'Motion', 'Generic'];
const DEVICE_NAMES = ['Thermostat-LivingRoom', 'Sensor-Backdoor', 'Monitor-Warehouse', 'LightSwitch-Office', 'WeatherStation-Rooftop']; // Changed from LOCATIONS
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
      device: DEVICE_NAMES[i % DEVICE_NAMES.length], // Changed from location to device
    });
  }
  return data;
}
