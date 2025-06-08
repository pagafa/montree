
import type { FC } from 'react';
import type { SensorData } from '@/types';
import SummaryCard from './SummaryCard';
import { HardDrive, Cpu } from 'lucide-react';

interface SummarySectionProps {
  sensorData: SensorData[];
  deviceCount: number; // Pass total device count directly
}

const SummarySection: FC<SummarySectionProps> = ({ sensorData, deviceCount }) => {
  const totalSensors = sensorData.length;
  // deviceCount is now passed directly as it's fetched independently on dashboard page
  
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SummaryCard
        title="Total Devices"
        value={deviceCount}
        icon={HardDrive}
        description="Number of unique devices"
      />
      <SummaryCard
        title="Total Sensors"
        value={totalSensors}
        icon={Cpu}
        description="Number of connected sensors"
      />
    </div>
  );
};

export default SummarySection;
