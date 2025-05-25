
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SensorTimeSeriesChart from '@/components/dashboard/SensorTimeSeriesChart';
import { generateSensorData, generateSensorReadings } from '@/lib/mock-data';
import type { SensorData, SensorReading } from '@/types';
import { BarChart3, LineChart, ChevronRight } from 'lucide-react';

export default function ChartsPage() {
  const [allSensors, setAllSensors] = useState<SensorData[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null);
  const [sensorReadings, setSensorReadings] = useState<SensorReading[]>([]);
  const [isLoadingSensors, setIsLoadingSensors] = useState(true);

  useEffect(() => {
    const sensors = generateSensorData(50); // Generate a list of 50 mock sensors
    setAllSensors(sensors);
    setIsLoadingSensors(false);
  }, []);

  const availableDevices = useMemo(() => {
    if (isLoadingSensors) return [];
    const deviceNames = new Set(allSensors.map(s => s.device));
    return Array.from(deviceNames).sort();
  }, [allSensors, isLoadingSensors]);

  const sensorsOfSelectedDevice = useMemo(() => {
    if (!selectedDeviceId) return [];
    return allSensors.filter(s => s.device === selectedDeviceId).sort((a,b) => a.name.localeCompare(b.name));
  }, [selectedDeviceId, allSensors]);

  useEffect(() => {
    // Reset sensor selection and readings if device changes
    setSelectedSensorId(null);
    setSensorReadings([]);
  }, [selectedDeviceId]);

  useEffect(() => {
    if (selectedSensorId && selectedDeviceId) {
      const selectedSensor = sensorsOfSelectedDevice.find(s => s.id === selectedSensorId);
      if (selectedSensor) {
        const readings = generateSensorReadings(selectedSensor.name, selectedSensor.type);
        setSensorReadings(readings);
      }
    } else {
      setSensorReadings([]);
    }
  }, [selectedSensorId, selectedDeviceId, sensorsOfSelectedDevice]);

  const selectedSensorDetails = useMemo(() => {
    if (!selectedSensorId) return null;
    return sensorsOfSelectedDevice.find(s => s.id === selectedSensorId);
  }, [selectedSensorId, sensorsOfSelectedDevice]);

  return (
    <AppLayout pageTitle="Sensor Charts">
      <Card className="shadow-md rounded-lg">
        <CardHeader>
          <CardTitle>Sensor Data Time Series</CardTitle>
          <CardDescription>Select a device, then a sensor to view its historical readings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Select
              onValueChange={(value) => {
                setSelectedDeviceId(value);
                // No need to reset selectedSensorId here, useEffect handles it
              }}
              disabled={isLoadingSensors || availableDevices.length === 0}
              value={selectedDeviceId || ""}
            >
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder={isLoadingSensors ? "Loading devices..." : "Select a device"} />
              </SelectTrigger>
              <SelectContent>
                {availableDevices.map((device) => (
                  <SelectItem key={device} value={device}>
                    {device}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedDeviceId && <ChevronRight size={24} className="hidden sm:block text-muted-foreground" />}

            <Select
              onValueChange={(value) => setSelectedSensorId(value)}
              disabled={!selectedDeviceId || sensorsOfSelectedDevice.length === 0}
              value={selectedSensorId || ""}
            >
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder={!selectedDeviceId ? "First select a device" : "Select a sensor"} />
              </SelectTrigger>
              <SelectContent>
                {sensorsOfSelectedDevice.map((sensor) => (
                  <SelectItem key={sensor.id} value={sensor.id}>
                    {sensor.name} ({sensor.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedSensorId && selectedSensorDetails ? (
            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                Readings for: {selectedSensorDetails.device} - {selectedSensorDetails.name}
              </h3>
              {sensorReadings.length > 0 ? (
                <SensorTimeSeriesChart data={sensorReadings} sensorName={`${selectedSensorDetails.name} (${selectedSensorDetails.unit})`} />
              ) : (
                <div className="flex flex-col items-center justify-center h-60 text-muted-foreground border-2 border-dashed border-border rounded-lg">
                  <LineChart size={40} className="mb-3 text-primary" />
                  <p className="text-md font-semibold">No readings available for this sensor.</p>
                  <p className="text-sm">Mock data might not have generated readings.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed border-border rounded-lg">
              <BarChart3 size={48} className="mb-4 text-primary" />
              <p className="text-lg font-semibold">
                {isLoadingSensors ? "Loading sensor data..." : selectedDeviceId ? "Select a Sensor" : "Select a Device"}
              </p>
              <p className="text-sm text-center">
                {isLoadingSensors ? "Please wait while we fetch the list of available sensors." : 
                 selectedDeviceId ? "Choose a sensor from the dropdown above to display its data chart." : 
                 "Choose a device from the dropdown above to see its available sensors."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
