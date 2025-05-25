
"use client";
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import SensorDataTable from '@/components/dashboard/SensorDataTable';
import { generateSensorData } from '@/lib/mock-data';
import type { SensorData } from '@/types';

export default function SensorsPage() {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const sData = generateSensorData(50); // Generate a comprehensive list for this page
    setSensorData(sData);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <AppLayout pageTitle="Sensor Management">
        <div className="flex h-[calc(100vh-theme(spacing.28))] w-full items-center justify-center">
          <p>Loading sensors...</p>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout pageTitle="Sensor Management">
      <Card className="shadow-md rounded-lg">
        <CardHeader>
          <CardTitle>All Sensors</CardTitle>
          <CardDescription>Detailed list of all sensor readings and their properties.</CardDescription>
        </CardHeader>
        <CardContent>
          <SensorDataTable data={sensorData} />
        </CardContent>
      </Card>
    </AppLayout>
  );
}
