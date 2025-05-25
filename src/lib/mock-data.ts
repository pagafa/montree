
import type { SensorData, ManagedDevice, SensorReading } from '@/types';
import { subMinutes, subHours, format } from 'date-fns';

export const SENSOR_NAMES_ARRAY = [
  'Alpha-001', 'Bravo-007', 'Charlie-113', 'Delta-224', 'Echo-5',
  'Foxtrot-99', 'Golf-747', 'Hotel-California', 'India-One', 'Juliet-Rose'
];
export const SENSOR_TYPES_ARRAY: SensorData['type'][] = ['Temperature', 'Humidity', 'Pressure', 'Light', 'Motion', 'Generic', 'CO2'];
export const DEVICE_NAMES_ARRAY = ['Thermostat-LivingRoom', 'Sensor-Backdoor', 'Monitor-Warehouse', 'LightSwitch-Office', 'WeatherStation-Rooftop'];

const UNITS: { [key in SensorData['type']]: string } = {
  Temperature: '°C',
  Humidity: '%',
  Pressure: 'hPa',
  Light: 'lux',
  Motion: 'detections',
  Generic: 'units',
  CO2: 'ppm'
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

export function generateSensorReadings(sensorName: string, sensorType: SensorData['type'], count: number = 24): SensorReading[] {
  const readings: SensorReading[] = [];
  const now = new Date();
  let baseValue: number;
  // Slightly different base values for different sensor types for variety
  switch (sensorType) {
    case 'Temperature': baseValue = 20; break;
    case 'Humidity': baseValue = 55; break;
    case 'Pressure': baseValue = 1012; break;
    case 'Light': baseValue = 450; break;
    case 'Motion': baseValue = 1; break; // Represents detection counts, so smaller, integer-like
    case 'CO2': baseValue = 450; break; // Base value for CO2 in ppm
    default: baseValue = 30;
  }

  for (let i = 0; i < count; i++) {
    let readingValue: number;
    if (sensorType === 'Motion') {
      // Motion typically is binary (detected/not) or a count over a small interval
      readingValue = Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0; // 0, 1, 2, or 3 detections
    } else {
      // For other sensors, a continuous value with some noise
      readingValue = parseFloat((baseValue + (Math.random() * (baseValue * 0.1) - (baseValue * 0.05))).toFixed(2)); // +/- 5% noise
    }
    
    readings.push({
      timestamp: format(subHours(now, count - 1 - i), 'HH:mm'), // e.g., "14:30"
      value: readingValue
    });
  }
  return readings;
}
