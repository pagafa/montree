
"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SensorTimeSeriesChart from '@/components/dashboard/SensorTimeSeriesChart';
import { generateSensorReadings } from '@/lib/mock-data';
import type { SensorData, SensorReading, ManagedDevice, DBSensor } from '@/types';
import { BarChart3, LineChart, ChevronRight, Loader2 } from 'lucide-react';
import { getDevices } from '@/app/devices/actions';
import { getSensors as getAllDbSensors } from '@/app/sensors/actions'; // Renamed to avoid conflict
import { useToast } from '@/hooks/use-toast';

// Helper to map DBSensor to a simpler SensorData-like structure for dropdowns if needed
interface ChartSensorInfo {
  id: string;
  name: string;
  type: SensorData['type'];
  unit: string;
  deviceId: string;
}

const mapDbSensorToChartSensorInfo = (dbSensor: DBSensor): ChartSensorInfo => ({
  id: dbSensor.id,
  name: dbSensor.name,
  type: dbSensor.type,
  unit: dbSensor.unit,
  deviceId: dbSensor.deviceId,
});


export default function ChartsPage() {
  const [allDbSensors, setAllDbSensors] = useState<DBSensor[]>([]);
  const [availableDevices, setAvailableDevices] = useState<ManagedDevice[]>([]);
  
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null);
  const [sensorReadings, setSensorReadings] = useState<SensorReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedDbSensors, fetchedDevices] = await Promise.all([
        getAllDbSensors(),
        getDevices()
      ]);
      setAllDbSensors(fetchedDbSensors);
      setAvailableDevices(fetchedDevices.sort((a,b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error("Failed to fetch data for charts:", error);
      toast({ title: "Error", description: "Could not load device or sensor list for charts.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);


  const sensorsOfSelectedDevice = useMemo((): ChartSensorInfo[] => {
    if (!selectedDeviceId) return [];
    return allDbSensors
      .filter(s => s.deviceId === selectedDeviceId)
      .map(mapDbSensorToChartSensorInfo)
      .sort((a,b) => a.name.localeCompare(b.name));
  }, [selectedDeviceId, allDbSensors]);

  useEffect(() => {
    // Reset sensor selection and readings if device changes
    setSelectedSensorId(null);
    setSensorReadings([]);
  }, [selectedDeviceId]);

  useEffect(() => {
    if (selectedSensorId && selectedDeviceId) {
      const selectedSensorInfo = sensorsOfSelectedDevice.find(s => s.id === selectedSensorId);
      if (selectedSensorInfo) {
        // For charts, we still use mock readings generator.
        // In a real scenario, this would fetch historical data from the DB.
        const readings = generateSensorReadings(selectedSensorInfo.name, selectedSensorInfo.type);
        setSensorReadings(readings);
      }
    } else {
      setSensorReadings([]);
    }
  }, [selectedSensorId, selectedDeviceId, sensorsOfSelectedDevice]);

  const selectedSensorDetails = useMemo(() => {
    if (!selectedSensorId) return null;
    const device = availableDevices.find(d => d.id === selectedDeviceId);
    const sensorInfo = sensorsOfSelectedDevice.find(s => s.id === selectedSensorId);
    if (!device || !sensorInfo) return null;
    return {
      deviceName: device.name,
      sensorName: sensorInfo.name,
      sensorUnit: sensorInfo.unit,
    };
  }, [selectedSensorId, selectedDeviceId, sensorsOfSelectedDevice, availableDevices]);

  return (
    <AppLayout pageTitle="Sensor Charts">
      <Card className="shadow-md rounded-lg">
        <CardHeader>
          <CardTitle>Sensor Data Time Series</CardTitle>
          <CardDescription>Select a device, then a sensor to view its historical readings (mock data).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
             <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading devices and sensors...</p>
            </div>
          ) : (
            <>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <Select
                onValueChange={(value) => setSelectedDeviceId(value)}
                disabled={availableDevices.length === 0}
                value={selectedDeviceId || ""}
              >
                <SelectTrigger className="w-full sm:w-[250px]">
                  <SelectValue placeholder="Select a device" />
                </SelectTrigger>
                <SelectContent>
                  {availableDevices.map((device) => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.name} ({device.userVisibleId})
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
                  <SelectValue placeholder={!selectedDeviceId ? "First select a device" : (sensorsOfSelectedDevice.length === 0 ? "No sensors for device" : "Select a sensor")} />
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
                  Readings for: {selectedSensorDetails.deviceName} - {selectedSensorDetails.sensorName}
                </h3>
                {sensorReadings.length > 0 ? (
                  <SensorTimeSeriesChart data={sensorReadings} sensorName={`${selectedSensorDetails.sensorName} (${selectedSensorDetails.sensorUnit})`} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-60 text-muted-foreground border-2 border-dashed border-border rounded-lg">
                    <LineChart size={40} className="mb-3 text-primary" />
                    <p className="text-md font-semibold">No readings available for this sensor.</p>
                    <p className="text-sm">Mock data might not have generated readings or this would fetch historical data.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed border-border rounded-lg">
                <BarChart3 size={48} className="mb-4 text-primary" />
                <p className="text-lg font-semibold">
                  {selectedDeviceId ? (sensorsOfSelectedDevice.length === 0 ? "No Sensors on Selected Device" : "Select a Sensor") : "Select a Device"}
                </p>
                <p className="text-sm text-center">
                  {selectedDeviceId ? 
                   (sensorsOfSelectedDevice.length === 0 ? "The chosen device currently has no registered sensors." : "Choose a sensor from the dropdown above to display its data chart.") : 
                   "Choose a device from the dropdown above to see its available sensors."}
                </p>
              </div>
            )}
            </>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
