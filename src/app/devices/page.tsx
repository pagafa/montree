
"use client";
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { generateSensorData } from '@/lib/mock-data';
import type { SensorData } from '@/types';
import { HardDrive, Cpu } from 'lucide-react';

interface DeviceInfo {
  name: string;
  sensorCount: number;
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const allSensorData = generateSensorData(50); // Generate more data for a comprehensive list
    const deviceMap = new Map<string, number>();
    
    allSensorData.forEach(sensor => {
      deviceMap.set(sensor.device, (deviceMap.get(sensor.device) || 0) + 1);
    });
    
    const uniqueDevices: DeviceInfo[] = Array.from(deviceMap.entries()).map(([name, count]) => ({
      name,
      sensorCount: count,
    })).sort((a,b) => a.name.localeCompare(b.name));
    
    setDevices(uniqueDevices);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <AppLayout pageTitle="Device Management">
        <div className="flex h-[calc(100vh-theme(spacing.28))] w-full items-center justify-center">
          <p>Loading devices...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="Device Management">
      <Card className="shadow-md rounded-lg">
        <CardHeader>
          <CardTitle>All Registered Devices</CardTitle>
          <CardDescription>List of all connected devices and their respective sensor counts.</CardDescription>
        </CardHeader>
        <CardContent>
          {devices.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device Name</TableHead>
                    <TableHead className="text-right">Attached Sensors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices.map((device) => (
                    <TableRow key={device.name}>
                      <TableCell className="font-medium">
                        <HardDrive className="h-4 w-4 mr-2 inline-block text-muted-foreground" />
                        {device.name}
                      </TableCell>
                      <TableCell className="text-right">
                        <Cpu className="h-4 w-4 mr-1 inline-block text-muted-foreground" />
                        {device.sensorCount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No devices found. Start by adding sensor data.</p>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
