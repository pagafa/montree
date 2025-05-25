
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
import { Thermometer, Zap, Droplets, Gauge, LucideIcon, Lightbulb, AlertCircle, HardDrive } from 'lucide-react';

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

  const sortedData = [...data].sort((a, b) => {
    if (a.device < b.device) return -1;
    if (a.device > b.device) return 1;
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Device</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Last Update</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((sensor) => (
            <TableRow key={sensor.id}>
              <TableCell className="font-medium">
                 {/* Using HardDrive icon for device, could be made more dynamic if needed */}
                <HardDrive className="h-4 w-4 mr-2 inline-block text-muted-foreground" />
                {sensor.device}
              </TableCell>
              <TableCell>{sensor.name}</TableCell>
              <TableCell>
                <SensorTypeIcon type={sensor.type} />
                {sensor.type}
              </TableCell>
              <TableCell>{sensor.value} {sensor.unit}</TableCell>
              <TableCell>{format(new Date(sensor.timestamp), 'PPpp')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default SensorDataTable;
