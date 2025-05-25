
import type { FC } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { SensorData } from '@/types';
import { Thermometer, Zap, Droplets, Gauge, LucideIcon, Lightbulb, AlertCircle, HardDrive, Pencil, Trash2, TvMinimal } from 'lucide-react'; // Added TvMinimal for Channel

interface SensorDataTableProps {
  data: SensorData[];
  onEditSensor?: (sensor: SensorData) => void;
  onDeleteSensor?: (sensor: SensorData) => void;
}

const SensorTypeIcon: FC<{ type: SensorData['type'] }> = ({ type }) => {
  const icons: Record<SensorData['type'], LucideIcon> = {
    Temperature: Thermometer,
    Humidity: Droplets,
    Pressure: Gauge,
    Light: Lightbulb,
    Motion: Zap,
    Generic: AlertCircle,
    CO2: AlertCircle,
  };
  const IconComponent = icons[type] || AlertCircle;
  return <IconComponent className="h-4 w-4 mr-2 inline-block" />;
};

const SensorDataTable: FC<SensorDataTableProps> = ({ data, onEditSensor, onDeleteSensor }) => {
  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">No sensor data available.</p>;
  }

  const sortedData = [...data].sort((a, b) => {
    if (a.device.toLowerCase() < b.device.toLowerCase()) return -1;
    if (a.device.toLowerCase() > b.device.toLowerCase()) return 1;
    if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
    if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
    if (a.channel < b.channel) return -1;
    if (a.channel > b.channel) return 1;
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
            <TableHead>Channel</TableHead>
            {(onEditSensor || onDeleteSensor) && <TableHead className="text-right w-[120px]">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((sensor) => (
            <TableRow key={sensor.id}><TableCell className="font-medium">
                <HardDrive className="h-4 w-4 mr-2 inline-block text-muted-foreground" />
                {sensor.device}
              </TableCell><TableCell>{sensor.name}</TableCell><TableCell>
                <SensorTypeIcon type={sensor.type} />
                {sensor.type}
              </TableCell><TableCell>
                <TvMinimal className="h-4 w-4 mr-2 inline-block text-muted-foreground" />
                {sensor.channel}
              </TableCell>
              {(onEditSensor || onDeleteSensor) && (
                <TableCell className="text-right">
                  {onEditSensor && (
                    <Button variant="ghost" size="icon" onClick={() => onEditSensor(sensor)} className="mr-2">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {onDeleteSensor && (
                    <Button variant="ghost" size="icon" onClick={() => onDeleteSensor(sensor)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default SensorDataTable;
