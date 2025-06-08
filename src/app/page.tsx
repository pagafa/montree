
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
  const [apiUrl, setApiUrl] = useState('/api/ingest-readings'); // Default for SSR

  useEffect(() => {
    // This will only run on the client, after initial hydration
    setApiUrl(`${window.location.origin}/api/ingest-readings`);
  }, []); // Empty dependency array ensures this runs once on mount

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
      <Card className="mb-6 shadow-md rounded-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center">
            <Info className="h-5 w-5 mr-2 text-primary" />
            <CardTitle className="text-lg">Device Data Ingestion</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your devices should send their sensor readings via POST request to the following URL:
          </p>
          <div className="mt-2 p-3 bg-muted rounded-md">
            <code className="text-sm font-mono text-foreground break-all">{apiUrl}</code>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Ensure the request body is a JSON payload in the format:
          </p>
          <pre className="mt-1 p-2 bg-muted/50 rounded-md text-xs font-mono text-foreground overflow-x-auto">
            {`{
  "device_id": "your-device-userVisibleId",
  "timestamp": "YYYY-MM-DDTHH:mm:ssZ",
  "readings": [
    {"channel": 1, "type": "Temperature", "value": 23.5},
    {"channel": 1, "type": "CO2", "value": 600},
    {"channel": 2, "type": "Light", "value": 1200}
  ]
}`}
          </pre>
           <p className="text-xs text-muted-foreground mt-3">
            Note: The `device_id` should be the user-visible ID you assign to devices.
            The `timestamp` in the payload is for the batch of readings. Individual sensor readings will be recorded with the server's current time when processed.
            The `channel` field is mandatory for each reading (1-8). Sensor `type` should match system types (e.g., "Temperature", "CO2").
          </p>
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
