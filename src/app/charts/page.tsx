
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SensorTimeSeriesChart from '@/components/dashboard/SensorTimeSeriesChart';
import { generateSensorData, generateSensorReadings } from '@/lib/mock-data';
import type { SensorData, SensorReading } from '@/types';
import { BarChart3, LineChart } from 'lucide-react';

export default function ChartsPage() {
  const [allSensors, setAllSensors] = useState<SensorData[]>([]);
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null);
  const [sensorReadings, setSensorReadings] = useState<SensorReading[]>([]);
  const [isLoadingSensors, setIsLoadingSensors] = useState(true);

  useEffect(() => {
    // Simulate fetching all available sensors
    const sensors = generateSensorData(15); // Generate a list of 15 mock sensors
    setAllSensors(sensors);
    setIsLoadingSensors(false);
  }, []);

  useEffect(() => {
    if (selectedSensorId) {
      const selectedSensor = allSensors.find(s => s.id === selectedSensorId);
      if (selectedSensor) {
        const readings = generateSensorReadings(selectedSensor.name, selectedSensor.type);
        setSensorReadings(readings);
      }
    } else {
      setSensorReadings([]); // Clear readings if no sensor is selected
    }
  }, [selectedSensorId, allSensors]);

  const selectedSensor = useMemo(() => {
    return allSensors.find(s => s.id === selectedSensorId);
  }, [selectedSensorId, allSensors]);

  return (
    <AppLayout pageTitle="Sensor Charts">
      <Card className="shadow-md rounded-lg">
        <CardHeader>
          <CardTitle>Sensor Data Time Series</CardTitle>
          <CardDescription>Select a sensor to view its historical readings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Select
              onValueChange={(value) => setSelectedSensorId(value)}
              disabled={isLoadingSensors || allSensors.length === 0}
            >
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder={isLoadingSensors ? "Loading sensors..." : "Select a sensor"} />
              </SelectTrigger>
              <SelectContent>
                {allSensors.map((sensor) => (
                  <SelectItem key={sensor.id} value={sensor.id}>
                    {sensor.device} - {sensor.name} ({sensor.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedSensorId && selectedSensor ? (
            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                Readings for: {selectedSensor.device} - {selectedSensor.name}
              </h3>
              {sensorReadings.length > 0 ? (
                <SensorTimeSeriesChart data={sensorReadings} sensorName={`${selectedSensor.name} (${selectedSensor.unit})`} />
              ) : (
                <div className="flex flex-col items-center justify-center h-60 text-muted-foreground border-2 border-dashed border-border rounded-lg">
                  <LineChart size={40} className="mb-3 text-primary" />
                  <p className="text-md font-semibold">No readings available for this period.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed border-border rounded-lg">
              <BarChart3 size={48} className="mb-4 text-primary" />
              <p className="text-lg font-semibold">Select a Sensor</p>
              <p className="text-sm">Choose a sensor from the dropdown above to display its data chart.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
