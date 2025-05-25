import type { FC } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { SensorData } from '@/types';
import { format } from 'date-fns';
import { Thermometer, Zap, Droplets, Gauge, LucideIcon, Lightbulb, Wind, AlertCircle } from 'lucide-react';

interface SensorDataTableProps {
  data: SensorData[];
}

const SensorTypeIcon: FC<{ type: SensorData['type'] }> = ({ type }) => {
  const icons: Record<SensorData['type'], LucideIcon> = {
    Temperature: Thermometer,
    Humidity: Droplets,
    Pressure: Gauge,
    Light: Lightbulb,
    Motion: Zap,
    Generic: AlertCircle,
  };
  const IconComponent = icons[type] || AlertCircle;
  return <IconComponent className="h-4 w-4 mr-2 inline-block" />;
};

const SensorDataTable: FC<SensorDataTableProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">No sensor data available.</p>;
  }
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Last Update</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((sensor) => (
            <TableRow key={sensor.id}>
              <TableCell className="font-medium">{sensor.name}</TableCell>
              <TableCell>
                <SensorTypeIcon type={sensor.type} />
                {sensor.type}
              </TableCell>
              <TableCell>{sensor.value} {sensor.unit}</TableCell>
              <TableCell>{sensor.location}</TableCell>
              <TableCell>{format(new Date(sensor.timestamp), 'PPpp')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default SensorDataTable;
