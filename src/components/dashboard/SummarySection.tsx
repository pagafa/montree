
import type { FC } from 'react';
import type { SensorData } from '@/types';
import SummaryCard from './SummaryCard';
import { HardDrive, Cpu } from 'lucide-react'; // Changed Chip to Cpu

interface SummarySectionProps {
  sensorData: SensorData[];
}

const SummarySection: FC<SummarySectionProps> = ({ sensorData }) => {
  const totalSensors = sensorData.length;
  const uniqueDevices = new Set(sensorData.map(sensor => sensor.device));
  const numberOfDevices = uniqueDevices.size;
  
  return (
    <div className="grid gap-4 md:grid-cols-2"> {/* Changed to two columns for two cards */}
      <SummaryCard
        title="Total Devices"
        value={numberOfDevices}
        icon={HardDrive}
        description="Number of unique devices"
      />
      <SummaryCard
        title="Total Sensors"
        value={totalSensors}
        icon={Cpu} // Using Cpu icon for sensors
        description="Number of connected sensors"
      />
    </div>
  );
};

export default SummarySection;

