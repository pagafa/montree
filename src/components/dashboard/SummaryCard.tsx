import type { FC, ElementType } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: ElementType;
  description?: string;
  className?: string;
}

const SummaryCard: FC<SummaryCardProps> = ({ title, value, icon: Icon, description, className }) => {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
};

export default SummaryCard;
