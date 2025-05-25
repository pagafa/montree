import type { FC } from 'react';
import type { SensorData } from '@/types';
import SummaryCard from './SummaryCard';
import { HardDrive } from 'lucide-react';

interface SummarySectionProps {
  sensorData: SensorData[];
}

const SummarySection: FC<SummarySectionProps> = ({ sensorData }) => {
  const totalDevices = sensorData.length;
  
  return (
    <div className="grid gap-4 md:grid-cols-1"> {/* Changed to single column for one card */}
      <SummaryCard
        title="Total Devices"
        value={totalDevices}
        icon={HardDrive}
        description="Number of connected sensors"
      />
      {/* Average Value SummaryCard removed */}
    </div>
  );
};

export default SummarySection;
