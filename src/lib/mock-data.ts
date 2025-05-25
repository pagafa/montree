
import type { SensorData, ManagedDevice } from '@/types';
import { subMinutes } from 'date-fns';

export const SENSOR_NAMES_ARRAY = [
  'Alpha-001', 'Bravo-007', 'Charlie-113', 'Delta-224', 'Echo-5',
  'Foxtrot-99', 'Golf-747', 'Hotel-California', 'India-One', 'Juliet-Rose'
];
export const SENSOR_TYPES_ARRAY: SensorData['type'][] = ['Temperature', 'Humidity', 'Pressure', 'Light', 'Motion', 'Generic'];
export const DEVICE_NAMES_ARRAY = ['Thermostat-LivingRoom', 'Sensor-Backdoor', 'Monitor-Warehouse', 'LightSwitch-Office', 'WeatherStation-Rooftop'];

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
    const type = SENSOR_TYPES_ARRAY[i % SENSOR_TYPES_ARRAY.length];
    data.push({
      id: crypto.randomUUID(),
      name: SENSOR_NAMES_ARRAY[i % SENSOR_NAMES_ARRAY.length],
      type,
      value: parseFloat((Math.random() * 100).toFixed(2)),
      unit: UNITS[type],
      timestamp: subMinutes(now, Math.floor(Math.random() * 60)),
      device: DEVICE_NAMES_ARRAY[i % DEVICE_NAMES_ARRAY.length],
    });
  }
  return data;
}

export function generateInitialDeviceList(): ManagedDevice[] {
  return DEVICE_NAMES_ARRAY.map((name, index) => ({
    id: crypto.randomUUID(), // Internal system ID
    userVisibleId: `DEV-${(index + 1).toString().padStart(3, '0')}`, // User-facing, editable ID
    name,
  }));
}
