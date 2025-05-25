import type { FC } from 'react';
import type { SensorData } from '@/types';
import SummaryCard from './SummaryCard';
import { HardDrive, Activity } from 'lucide-react';

interface SummarySectionProps {
  sensorData: SensorData[];
}

const SummarySection: FC<SummarySectionProps> = ({ sensorData }) => {
  const totalDevices = sensorData.length;
  
  const averageValue = totalDevices > 0 
    ? (sensorData.reduce((sum, sensor) => sum + sensor.value, 0) / totalDevices).toFixed(2)
    : 'N/A';

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SummaryCard
        title="Total Devices"
        value={totalDevices}
        icon={HardDrive}
        description="Number of connected sensors"
      />
      <SummaryCard
        title="Average Value"
        value={averageValue !== 'N/A' ? `${averageValue} units` : 'N/A'}
        icon={Activity}
        description="Average reading across all sensors"
      />
    </div>
  );
};

export default SummarySection;
