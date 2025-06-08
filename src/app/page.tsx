
"use client"
import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SummarySection from '@/components/dashboard/SummarySection';
import SensorDataTable from '@/components/dashboard/SensorDataTable';
import type { SensorData, DBSensor, ManagedDevice, ApiRequestLog } from '@/types';
import { getSensors as getAllDbSensors } from '@/app/sensors/actions';
import { getDevices as getAllDbDevices } from '@/app/devices/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Info } from 'lucide-react';


// Helper to map DBSensor to SensorData for UI display on dashboard
const mapDbSensorToUi = (dbSensor: DBSensor): SensorData => ({
  id: dbSensor.id,
  name: dbSensor.name,
  type: dbSensor.type,
  channel: dbSensor.channel,
  value: dbSensor.currentValue,
  unit: dbSensor.unit,
  timestamp: dbSensor.lastTimestamp ? new Date(dbSensor.lastTimestamp) : null,
  deviceId: dbSensor.deviceId,
});


export default function DashboardPage() {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [devices, setDevices] = useState<ManagedDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [apiUrl, setApiUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setApiUrl(`${window.location.origin}/api/ingest-readings`);
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedDbSensors, fetchedDevices] = await Promise.all([
        getAllDbSensors(),
        getAllDbDevices()
      ]);
      
      const sensorsForDashboard = fetchedDbSensors.map(mapDbSensorToUi);
      setSensorData(sensorsForDashboard);
      setDevices(fetchedDevices);

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast({ title: "Error", description: "Could not load dashboard data.", variant: "destructive" });
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
      <Card className="mb-6 shadow-md rounded-lg border border-border p-4">
        <CardHeader className="p-2 pt-0">
          <div className="flex items-center mb-2">
            <Info className="h-5 w-5 mr-2 text-primary" />
            <CardTitle className="text-lg">Device Data Ingestion API Endpoint</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-2 pb-0">
        {apiUrl ? (
          <>
            <p className="text-sm text-muted-foreground">
              Your devices should send POST requests to:
            </p>
            <div className="mt-2 p-3 bg-muted rounded-md">
              <code className="text-sm font-mono text-foreground break-all">{apiUrl}</code>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Loading API endpoint URL...</p>
        )}
        </CardContent>
      </Card>

      <SummarySection sensorData={sensorData} deviceCount={devices.length} />
      
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
