
"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SensorTimeSeriesChart from '@/components/dashboard/SensorTimeSeriesChart';
import type { SensorReading, ManagedDevice, DBSensor } from '@/types';
import { BarChart3, LineChart, ChevronRight, Loader2 } from 'lucide-react';
import { getDevices } from '@/app/devices/actions';
import { getSensors as getAllDbSensors } from '@/app/sensors/actions';
import { getSensorReadings } from '@/app/readings/actions'; // Import new action
import { useToast } from '@/hooks/use-toast';

interface ChartSensorInfo {
  id: string;
  name: string;
  type: DBSensor['type'];
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
  const [isLoadingReadings, setIsLoadingReadings] = useState(false);
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
    setSelectedSensorId(null);
    setSensorReadings([]);
  }, [selectedDeviceId]);

  useEffect(() => {
    if (selectedSensorId && selectedDeviceId) {
      const fetchReadings = async () => {
        setIsLoadingReadings(true);
        try {
          const readings = await getSensorReadings(selectedSensorId);
          setSensorReadings(readings);
        } catch (error) {
          console.error("Failed to fetch sensor readings:", error);
          toast({ title: "Error", description: "Could not load readings for the selected sensor.", variant: "destructive" });
          setSensorReadings([]);
        } finally {
          setIsLoadingReadings(false);
        }
      };
      fetchReadings();
    } else {
      setSensorReadings([]);
    }
  }, [selectedSensorId, selectedDeviceId, toast]);

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
          <CardDescription>Select a device, then a sensor to view its historical readings from the database.</CardDescription>
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
                disabled={!selectedDeviceId || sensorsOfSelectedDevice.length === 0 || isLoadingReadings}
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

            {isLoadingReadings && (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Loading sensor readings...</p>
              </div>
            )}

            {!isLoadingReadings && selectedSensorId && selectedSensorDetails ? (
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
                    <p className="text-sm">This sensor may not have any recorded data yet.</p>
                  </div>
                )}
              </div>
            ) : !isLoadingReadings && (
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
