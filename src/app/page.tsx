
"use client"
import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SummarySection from '@/components/dashboard/SummarySection';
import SensorDataTable from '@/components/dashboard/SensorDataTable';
import type { SensorData, DBSensor, ManagedDevice } from '@/types';
import { getSensors as getAllDbSensors } from '@/app/sensors/actions';
import { getDevices as getAllDbDevices } from '@/app/devices/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// Helper to map DBSensor to SensorData for UI display on dashboard
const mapDbSensorToUi = (dbSensor: DBSensor): SensorData => ({
  id: dbSensor.id,
  name: dbSensor.name,
  type: dbSensor.type,
  channel: dbSensor.channel,
  value: dbSensor.currentValue,
  unit: dbSensor.unit,
  timestamp: dbSensor.lastTimestamp ? new Date(dbSensor.lastTimestamp) : null,
  deviceId: dbSensor.deviceId, // This is the ID, SummarySection might need device name if desired
});


export default function DashboardPage() {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [devices, setDevices] = useState<ManagedDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedDbSensors, fetchedDevices] = await Promise.all([
        getAllDbSensors(), // Fetches all sensors
        getAllDbDevices()  // Fetches all devices
      ]);
      
      // For the dashboard overview, let's take a slice of sensors or all if less than 10
      const sensorsForDashboard = fetchedDbSensors.slice(0, 10).map(mapDbSensorToUi);
      setSensorData(sensorsForDashboard);
      setDevices(fetchedDevices);

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast({ title: "Error", description: "Could not load dashboard data.", variant: "destructive" });
      // Set empty arrays on error to prevent UI breakage
      setSensorData([]);
      setDevices([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (isLoading) {
    return (
      <AppLayout pageTitle="Dashboard Overview">
        <div className="flex h-[calc(100vh-theme(spacing.28))] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Loading dashboard data...</p>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout pageTitle="Dashboard Overview">
      {/* SummarySection expects SensorData where 'device' is deviceId. It counts unique deviceIds. */}
      <SummarySection sensorData={sensorData} deviceCount={devices.length} />
      <div className="grid auto-rows-max items-start gap-6 md:gap-8 lg:grid-cols-1">
        <Card className="lg:col-span-1 shadow-md rounded-lg">
          <CardHeader>
            <CardTitle>Sensor Activity Overview</CardTitle>
            <CardDescription>A quick look at recent sensor data from various devices.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* SensorDataTable expects SensorData where 'device' is deviceId */}
            <SensorDataTable data={sensorData} />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
