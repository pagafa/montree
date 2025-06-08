
"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import SensorDataTable from '@/components/dashboard/SensorDataTable';
import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SENSOR_TYPES_ARRAY, SENSOR_NAMES_ARRAY } from '@/lib/mock-data';
import type { SensorData, ManagedDevice, DBSensor, ApiRequestLog } from '@/types';
import { PlusCircle, Loader2, AlertTriangle, Info, TableIcon } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader as ShadTableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { getSensors, addSensor, updateSensor, deleteSensor, type AddSensorFormData, type UpdateSensorFormData } from './actions';
import { getDevices } from '@/app/devices/actions';
import { getUnregisteredDeviceOrSensorAttempts, clearApiRequestLogs } from '@/app/logs/actions';

// Zod schema for form validation
const sensorFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Sensor name is required"),
  type: z.enum(SENSOR_TYPES_ARRAY),
  channel: z.coerce.number().int().min(1, "Channel must be between 1 and 8").max(8, "Channel must be between 1 and 8"),
  initialValue: z.coerce.number().nullable().default(null),
  unit: z.string().min(1, "Unit is required"),
  deviceId: z.string().min(1, "Device assignment is required"),
});
type SensorFormValues = z.infer<typeof sensorFormSchema>;

const UNITS_OPTIONS: { [key in SensorData['type']]: string } = {
  Temperature: '°C',
  Humidity: '%',
  Pressure: 'hPa',
  Light: 'lux',
  Motion: 'detections',
  Generic: 'units',
  CO2: 'ppm'
};

const METRIC_KEY_TO_SENSOR_TYPE: Record<string, SensorData['type'] | undefined> = {
  temperature: 'Temperature',
  humidity: 'Humidity',
  co2: 'CO2',
  pressure: 'Pressure',
  light: 'Light',
};

interface UnregisteredSensorAttempt {
  key: string; // Unique key for React list, e.g., deviceId-channel-type
  deviceId: string;
  deviceName?: string;
  channel: number;
  attemptedType: SensorData['type'];
  lastAttempt: string;
}

// Helper to map DBSensor to SensorData for UI display
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

export default function SensorsPage() {
  const [sensors, setSensors] = useState<SensorData[]>([]);
  const [devices, setDevices] = useState<ManagedDevice[]>([]);
  const [unregisteredSensorAttempts, setUnregisteredSensorAttempts] = useState<UnregisteredSensorAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isClearLogsDialogOpen, setIsClearLogsDialogOpen] = useState(false);
  const [currentSensor, setCurrentSensor] = useState<SensorData | null>(null);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const { toast } = useToast();

  const form = useForm<SensorFormValues>({
    resolver: zodResolver(sensorFormSchema),
  });

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedDbSensors, fetchedDevices] = await Promise.all([
        getSensors(),
        getDevices()
      ]);
      setSensors(fetchedDbSensors.map(mapDbSensorToUi));
      setDevices(fetchedDevices.sort((a,b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error("Failed to fetch sensor or device data:", error);
      toast({ title: "Error", description: "Could not load sensor or device data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  const fetchUnregisteredSensorAlerts = useCallback(async (currentSensors: SensorData[], currentDevices: ManagedDevice[]) => {
    setIsLoadingLogs(true);
    try {
      const logs = await getUnregisteredDeviceOrSensorAttempts(100); // Fetch a decent number of logs
      const sensorErrorLogs = logs.filter(log => log.error_type === 'Partial Ingestion Error / Metric Error' && log.device_id_attempted && log.error_details);
      
      const attemptsMap = new Map<string, UnregisteredSensorAttempt>();
      const registeredDevicesMap = new Map(currentDevices.map(d => [d.id, d.name]));

      sensorErrorLogs.forEach(log => {
        try {
          const errorDetailsArray = JSON.parse(log.error_details!);
          if (Array.isArray(errorDetailsArray)) {
            errorDetailsArray.forEach(detail => {
              const deviceIdAttempted = log.device_id_attempted!;
              // Find the internal device ID from userVisibleId
              const matchedDevice = currentDevices.find(d => d.userVisibleId === deviceIdAttempted);
              if (!matchedDevice) return; // Skip if device itself isn't registered
              
              const internalDeviceId = matchedDevice.id;
              const channel = detail.channel;
              const metricKey = detail.metric;
              const attemptedType = METRIC_KEY_TO_SENSOR_TYPE[metricKey];

              if (attemptedType && channel) {
                const isRegistered = currentSensors.some(s => 
                  s.deviceId === internalDeviceId && 
                  s.channel === channel && 
                  s.type === attemptedType
                );

                if (!isRegistered) {
                  const key = `${internalDeviceId}-${channel}-${attemptedType}`;
                  const existing = attemptsMap.get(key);
                  if (!existing || new Date(log.timestamp) > new Date(existing.lastAttempt)) {
                    attemptsMap.set(key, {
                      key,
                      deviceId: internalDeviceId, // Store internal ID for form prefill
                      deviceName: registeredDevicesMap.get(internalDeviceId) || deviceIdAttempted,
                      channel,
                      attemptedType,
                      lastAttempt: log.timestamp,
                    });
                  }
                }
              }
            });
          }
        } catch (e) {
          console.warn("Failed to parse error_details for log:", log.id, e);
        }
      });
      setUnregisteredSensorAttempts(Array.from(attemptsMap.values()).sort((a,b) => new Date(b.lastAttempt).getTime() - new Date(a.lastAttempt).getTime()));
    } catch (error) {
      console.error("Failed to fetch unregistered sensor attempts:", error);
      toast({ title: "Error", description: "Could not load unregistered sensor configuration attempts.", variant: "destructive" });
    } finally {
      setIsLoadingLogs(false);
    }
  }, [toast]);


  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  useEffect(() => {
    if (!isLoading) { // Only fetch attempts after sensors and devices are loaded
        fetchUnregisteredSensorAlerts(sensors, devices);
    }
  }, [isLoading, sensors, devices, fetchUnregisteredSensorAlerts]);
  
  useEffect(() => {
    if (isFormDialogOpen) {
      if (dialogMode === 'edit' && currentSensor) {
        form.reset({
          id: currentSensor.id,
          name: currentSensor.name,
          type: currentSensor.type,
          channel: currentSensor.channel,
          initialValue: null, // Not relevant for edit, but keep in form state
          unit: currentSensor.unit,
          deviceId: currentSensor.deviceId,
        });
      } else { // Add mode, potentially prefilled
        const initialType = SENSOR_TYPES_ARRAY[0];
        form.reset({
          id: undefined,
          name: SENSOR_NAMES_ARRAY[Math.floor(Math.random() * SENSOR_NAMES_ARRAY.length)],
          type: initialType,
          channel: 1,
          initialValue: null,
          unit: UNITS_OPTIONS[initialType],
          deviceId: devices.length > 0 ? devices[0].id : '',
        });
      }
      form.clearErrors();
    }
  }, [isFormDialogOpen, dialogMode, currentSensor, form, devices]);

  const watchedType = form.watch("type");
  useEffect(() => {
    if (watchedType && isFormDialogOpen) {
      form.setValue("unit", UNITS_OPTIONS[watchedType]);
    }
  }, [watchedType, form, isFormDialogOpen]);


  const handleAddSensor = (prefill?: Partial<SensorFormValues>) => {
    setDialogMode('add');
    setCurrentSensor(null);
    // Apply prefills if any
    const initialType = prefill?.type || SENSOR_TYPES_ARRAY[0];
    form.reset({
      id: undefined,
      name: prefill?.name || SENSOR_NAMES_ARRAY[Math.floor(Math.random() * SENSOR_NAMES_ARRAY.length)],
      type: initialType,
      channel: prefill?.channel || 1,
      initialValue: prefill?.initialValue || null,
      unit: UNITS_OPTIONS[initialType],
      deviceId: prefill?.deviceId || (devices.length > 0 ? devices[0].id : ''),
    });
    form.clearErrors();
    setIsFormDialogOpen(true);
  };

  const handleEditSensor = (sensor: SensorData) => {
    setDialogMode('edit');
    setCurrentSensor(sensor);
    setIsFormDialogOpen(true); // useEffect will populate form
  };

  const handleDeleteSensor = (sensor: SensorData) => {
    setCurrentSensor(sensor);
    setIsDeleteDialogOpen(true);
  };

  const onSubmit = async (data: SensorFormValues) => {
    setIsSubmitting(true);
    form.clearErrors();

    const payload: AddSensorFormData | UpdateSensorFormData = {
        name: data.name,
        type: data.type,
        channel: data.channel,
        unit: data.unit,
        deviceId: data.deviceId,
        ...(dialogMode === 'add' && { initialValue: data.initialValue }),
    };

    let result;
    if (dialogMode === 'add') {
      result = await addSensor(payload as AddSensorFormData);
    } else { // dialogMode === 'edit'
      if (!currentSensor) {
        toast({ title: "Error", description: "No sensor selected for editing.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
      result = await updateSensor(currentSensor.id, payload as UpdateSensorFormData);
    }
      
    if (result.success && result.sensor) {
        await fetchPageData(); // Re-fetch for consistency
        toast({ title: dialogMode === 'add' ? "Sensor Added" : "Sensor Updated", description: `Sensor "${data.name}" has been processed.` });
        setIsFormDialogOpen(false);
    } else {
        if (result.errorField) {
        form.setError(result.errorField as keyof SensorFormValues, { type: "manual", message: result.message });
        } else {
        toast({ title: "Error", description: result.message || "Failed to process sensor.", variant: "destructive" });
        }
    }
    setIsSubmitting(false);
  };

  const onConfirmDelete = async () => {
    if (currentSensor) {
      setIsSubmitting(true);
      const result = await deleteSensor(currentSensor.id);
      setIsSubmitting(false);

      if (result.success) {
        await fetchPageData();
        setIsDeleteDialogOpen(false);
        toast({ title: "Sensor Deleted", description: `Sensor "${currentSensor.name}" has been deleted.`, variant: "destructive" });
      } else {
        toast({ title: "Error", description: result.message || "Failed to delete sensor.", variant: "destructive" });
      }
    }
  };

  const handleClearLogs = async () => {
    setIsSubmitting(true);
    const result = await clearApiRequestLogs();
    setIsSubmitting(false);
    if (result.success) {
      toast({ title: "Logs Cleared", description: result.message });
      await fetchUnregisteredSensorAlerts(sensors, devices); // Re-fetch to clear the list
    } else {
      toast({ title: "Error", description: result.message || "Failed to clear logs.", variant: "destructive" });
    }
    setIsClearLogsDialogOpen(false);
  };
  
  return (
    <AppLayout pageTitle="Sensor Management">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Manage Sensors</h2>
        <Button onClick={() => handleAddSensor()} disabled={isLoading}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Sensor
        </Button>
      </div>

      {/* Unregistered Sensor Configurations Card */}
      <Card className="mb-6 shadow-md rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                    Unregistered Sensor Configurations
                </CardTitle>
                <CardDescription>Sensor configurations that devices attempted to use but are not registered.</CardDescription>
            </div>
            {unregisteredSensorAttempts.length > 0 && (
                 <Button variant="outline" size="sm" onClick={() => setIsClearLogsDialogOpen(true)} disabled={isSubmitting || isLoadingLogs}>
                    Clear Alerts
                </Button>
            )}
        </CardHeader>
        <CardContent>
            {isLoadingLogs ? (
                <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="ml-2 text-muted-foreground">Loading alerts...</p>
                </div>
            ) : unregisteredSensorAttempts.length > 0 ? (
                 <div className="rounded-md border">
                    <Table>
                        <ShadTableHeader>
                        <TableRow>
                            <TableHead>Device</TableHead>
                            <TableHead>Channel</TableHead>
                            <TableHead>Attempted Type</TableHead>
                            <TableHead>Last Attempt</TableHead>
                            <TableHead className="text-right w-[120px]">Action</TableHead>
                        </TableRow>
                        </ShadTableHeader>
                        <TableBody>
                        {unregisteredSensorAttempts.map((attempt) => (
                            <TableRow key={attempt.key}>
                            <TableCell>{attempt.deviceName || attempt.deviceId}</TableCell>
                            <TableCell>{attempt.channel}</TableCell>
                            <TableCell>{attempt.attemptedType}</TableCell>
                            <TableCell>{new Date(attempt.lastAttempt).toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="default" size="sm" onClick={() => handleAddSensor({ deviceId: attempt.deviceId, channel: attempt.channel, type: attempt.attemptedType })}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add
                                </Button>
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                 </div>
            ) : (
                <div className="flex items-center text-sm text-muted-foreground py-6">
                    <Info className="h-5 w-5 mr-2 text-primary" />
                    No unregistered sensor configuration attempts found in recent logs.
                </div>
            )}
        </CardContent>
      </Card>


      <Card className="shadow-md rounded-lg">
        <CardHeader>
          <CardTitle>All Sensors</CardTitle>
          <CardDescription>
            Detailed list of all sensors stored in the database. Changes are persistent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading sensors and devices...</p>
            </div>
          ) : sensors.length > 0 ? (
            <SensorDataTable data={sensors} onEditSensor={handleEditSensor} onDeleteSensor={handleDeleteSensor} />
          ) : (
            <p className="text-sm text-muted-foreground py-10 text-center">No sensors found. Click "Add New Sensor" to start.</p>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Sensor Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={(isOpen) => { if (!isSubmitting) setIsFormDialogOpen(isOpen); }}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{dialogMode === 'add' ? 'Add New Sensor' : 'Edit Sensor'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sensorName">Sensor Name</Label>
                <Input id="sensorName" {...form.register("name")} disabled={isSubmitting} />
                {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="sensorType">Sensor Type</Label>
                <Controller
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                      <SelectTrigger id="sensorType">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {SENSOR_TYPES_ARRAY.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                 {form.formState.errors.type && <p className="text-sm text-destructive mt-1">{form.formState.errors.type.message}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="sensorChannel">Channel (1-8)</Label>
              <Input id="sensorChannel" type="number" {...form.register("channel")} disabled={isSubmitting} />
              {form.formState.errors.channel && <p className="text-sm text-destructive mt-1">{form.formState.errors.channel.message}</p>}
            </div>
            
            {dialogMode === 'add' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sensorInitialValue">Initial Value (Optional)</Label>
                  <Input id="sensorInitialValue" type="number" step="any" {...form.register("initialValue", { setValueAs: (v) => v === "" ? null : parseFloat(v) })} placeholder="e.g. 23.5" disabled={isSubmitting} />
                  {form.formState.errors.initialValue && <p className="text-sm text-destructive mt-1">{form.formState.errors.initialValue.message}</p>}
                </div>
                <div>
                  <Label htmlFor="sensorUnit">Unit (Auto-derived)</Label>
                  <Input id="sensorUnit" {...form.register("unit")} readOnly className="bg-muted/50" disabled={isSubmitting} />
                   {form.formState.errors.unit && <p className="text-sm text-destructive mt-1">{form.formState.errors.unit.message}</p>}
                </div>
              </div>
            )}
            {dialogMode === 'edit' && ( // Show unit field as read-only for edit mode as well
                <div>
                  <Label htmlFor="editSensorUnit">Unit (Auto-derived)</Label>
                  <Input id="editSensorUnit" {...form.register("unit")} readOnly className="bg-muted/50" disabled={isSubmitting} />
                   {form.formState.errors.unit && <p className="text-sm text-destructive mt-1">{form.formState.errors.unit.message}</p>}
                </div>
            )}

             <div>
              <Label htmlFor="sensorDevice">Device</Label>
              <Controller
                  control={form.control}
                  name="deviceId"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting || devices.length === 0}>
                      <SelectTrigger id="sensorDevice">
                        <SelectValue placeholder={devices.length === 0 ? "No devices available" : "Select device"} />
                      </SelectTrigger>
                      <SelectContent>
                        {devices.map(device => <SelectItem key={device.id} value={device.id}>{device.name} ({device.userVisibleId})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
              {form.formState.errors.deviceId && <p className="text-sm text-destructive mt-1">{form.formState.errors.deviceId.message}</p>}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => setIsFormDialogOpen(false)}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {dialogMode === 'add' ? 'Add Sensor' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Sensor Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(isOpen) => { if (!isSubmitting) setIsDeleteDialogOpen(isOpen); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the sensor "{currentSensor?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete} className={buttonVariants({ variant: "destructive" })} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Logs Confirmation Dialog */}
      <AlertDialog open={isClearLogsDialogOpen} onOpenChange={(isOpen) => { if (!isSubmitting) setIsClearLogsDialogOpen(isOpen); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All API Request Alerts?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all API request logs, which are used to generate these alerts. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearLogs} className={buttonVariants({ variant: "destructive" })} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Clear All Logs
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
