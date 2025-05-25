
"use client"
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SummarySection from '@/components/dashboard/SummarySection';
import SensorDataTable from '@/components/dashboard/SensorDataTable';
import { generateSensorData } from '@/lib/mock-data';
import type { SensorData } from '@/types';

export default function DashboardPage() {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Generate a smaller, representative set for the overview dashboard
    const sData = generateSensorData(10); 
    setSensorData(sData);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <AppLayout pageTitle="Dashboard Overview">
        <div className="flex h-[calc(100vh-theme(spacing.28))] w-full items-center justify-center"> {/* Adjusted height for loading */}
          <p>Loading dashboard...</p>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout pageTitle="Dashboard Overview">
      <SummarySection sensorData={sensorData} />
      <div className="grid auto-rows-max items-start gap-6 md:gap-8 lg:grid-cols-1">
        <Card className="lg:col-span-1 shadow-md rounded-lg">
          <CardHeader>
            <CardTitle>Sensor Activity Overview</CardTitle>
            <CardDescription>A quick look at recent sensor data from various devices.</CardDescription>
          </CardHeader>
          <CardContent>
            <SensorDataTable data={sensorData} />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
