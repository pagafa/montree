
"use client"

import type { FC } from 'react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart"
import type { SensorReading } from '@/types';

interface SensorTimeSeriesChartProps {
  data: SensorReading[];
  sensorName: string;
}

const SensorTimeSeriesChart: FC<SensorTimeSeriesChartProps> = ({ data, sensorName }) => {
  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">No historical data available for this sensor.</p>;
  }

  const chartConfig = {
    value: {
      label: sensorName,
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="timestamp" 
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => value as string}
            className="text-xs"
          />
          <YAxis 
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-xs"
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Legend content={<ChartLegendContent />} />
          <Line
            dataKey="value"
            type="monotone"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            dot={{
              fill: "hsl(var(--chart-1))",
              r: 3,
            }}
            activeDot={{
              r: 5,
              fill: "hsl(var(--chart-1))",
              stroke: "hsl(var(--background))",
              strokeWidth: 2,
            }}
            name={sensorName}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default SensorTimeSeriesChart;
