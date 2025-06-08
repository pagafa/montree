
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
import { SENSOR_TYPES_ARRAY, SENSOR_NAMES_ARRAY } from '@/lib/mock-data'; // SENSOR_NAMES_ARRAY for default name suggestion
import type { SensorData, ManagedDevice, DBSensor } from '@/types';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSensors, addSensor, updateSensor, deleteSensor } from './actions';
import { getDevices } from '@/app/devices/actions'; // To fetch devices for the dropdown

// Zod schema for form validation
const sensorFormSchema = z.object({
  id: z.string().optional(), // Not directly in form, but used for state
  name: z.string().min(1, "Sensor name is required"),
  type: z.enum(SENSOR_TYPES_ARRAY),
  channel: z.coerce.number().int().min(1, "Channel must be between 1 and 8").max(8, "Channel must be between 1 and 8"),
  initialValue: z.coerce.number().nullable().default(null), // For 'add' mode, represents 'currentValue'
  unit: z.string().min(1, "Unit is required"), // Derived, but part of form state
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentSensor, setCurrentSensor] = useState<SensorData | null>(null); // For edit/delete context
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const { toast } = useToast();

  const form = useForm<SensorFormValues>({
    resolver: zodResolver(sensorFormSchema),
  });

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedDbSensors, fetchedDevices] = await Promise.all([
        getSensors(),
        getDevices()
      ]);
      setSensors(fetchedDbSensors.map(mapDbSensorToUi));
      setDevices(fetchedDevices);
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
      toast({ title: "Error", description: "Could not load initial sensor or device data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);
  
  useEffect(() => {
    // Reset form when dialog opens or mode changes
    if (isFormDialogOpen) {
      if (dialogMode === 'edit' && currentSensor) {
        form.reset({
          id: currentSensor.id,
          name: currentSensor.name,
          type: currentSensor.type,
          channel: currentSensor.channel,
          initialValue: currentSensor.value, // Keep for form state, hidden in 'edit'
          unit: currentSensor.unit,         // Keep for form state, hidden in 'edit'
          deviceId: currentSensor.deviceId,
        });
      } else { // Add mode
        const initialType = SENSOR_TYPES_ARRAY[0];
        form.reset({
          id: undefined,
          name: SENSOR_NAMES_ARRAY[Math.floor(Math.random() * SENSOR_NAMES_ARRAY.length)],
          type: initialType,
          channel: 1,
          initialValue: null, // Default to no initial value
          unit: UNITS_OPTIONS[initialType],
          deviceId: devices.length > 0 ? devices[0].id : '', // Default to first device if available
        });
      }
    }
  }, [isFormDialogOpen, dialogMode, currentSensor, form, devices]);

  const watchedType = form.watch("type");
  useEffect(() => {
    if (watchedType && isFormDialogOpen) { // Update unit only when dialog is open and type changes
      form.setValue("unit", UNITS_OPTIONS[watchedType]);
    }
  }, [watchedType, form, isFormDialogOpen]);


  const handleAddSensor = () => {
    setDialogMode('add');
    setCurrentSensor(null);
    setIsFormDialogOpen(true);
  };

  const handleEditSensor = (sensor: SensorData) => {
    setDialogMode('edit');
    setCurrentSensor(sensor);
    setIsFormDialogOpen(true);
  };

  const handleDeleteSensor = (sensor: SensorData) => {
    setCurrentSensor(sensor);
    setIsDeleteDialogOpen(true);
  };

  const onSubmit = async (data: SensorFormValues) => {
    setIsSubmitting(true);
    form.clearErrors();

    if (dialogMode === 'add') {
      const result = await addSensor({
        name: data.name,
        type: data.type,
        channel: data.channel,
        unit: data.unit, // Unit is derived and set in form state
        deviceId: data.deviceId,
        initialValue: data.initialValue,
      });
      
      if (result.success && result.sensor) {
        // setSensors(prev => [mapDbSensorToUi(result.sensor!), ...prev].sort((a,b) => a.deviceId.localeCompare(b.deviceId) || a.name.localeCompare(b.name)));
        await fetchInitialData(); // Re-fetch for consistency
        toast({ title: "Sensor Added", description: `Sensor "${data.name}" has been added.` });
        setIsFormDialogOpen(false);
      } else {
        if (result.errorField) {
          form.setError(result.errorField as keyof SensorFormValues, { type: "manual", message: result.message });
        } else {
          toast({ title: "Error", description: result.message || "Failed to add sensor.", variant: "destructive" });
        }
      }
    } else { // dialogMode === 'edit'
      if (currentSensor) {
        // Unit is updated if type changes, handled by form.watch("type") useEffect
        const result = await updateSensor(currentSensor.id, {
          name: data.name,
          type: data.type,
          channel: data.channel,
          unit: data.unit, 
          deviceId: data.deviceId,
        });

        if (result.success && result.sensor) {
          // setSensors(prev => prev.map(s => s.id === currentSensor!.id ? mapDbSensorToUi(result.sensor!) : s).sort((a,b) =>a.deviceId.localeCompare(b.deviceId) || a.name.localeCompare(b.name)));
          await fetchInitialData(); // Re-fetch
          toast({ title: "Sensor Updated", description: `Sensor "${data.name}" has been updated.` });
          setIsFormDialogOpen(false);
        } else {
          if (result.errorField) {
            form.setError(result.errorField as keyof SensorFormValues, { type: "manual", message: result.message });
          } else {
            toast({ title: "Error", description: result.message || "Failed to update sensor.", variant: "destructive" });
          }
        }
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
        // setSensors(prev => prev.filter(s => s.id !== currentSensor.id));
        await fetchInitialData(); // Re-fetch
        setIsDeleteDialogOpen(false);
        toast({ title: "Sensor Deleted", description: `Sensor "${currentSensor.name}" has been deleted.`, variant: "destructive" });
      } else {
        toast({ title: "Error", description: result.message || "Failed to delete sensor.", variant: "destructive" });
      }
    }
  };
  
  return (
    <AppLayout pageTitle="Sensor Management">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Manage Sensors</h2>
        <Button onClick={handleAddSensor} disabled={isLoading}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Sensor
        </Button>
      </div>
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
                  <Input id="sensorInitialValue" type="number" step="0.01" {...form.register("initialValue")} placeholder="e.g. 23.5" disabled={isSubmitting} />
                  {form.formState.errors.initialValue && <p className="text-sm text-destructive mt-1">{form.formState.errors.initialValue.message}</p>}
                </div>
                <div>
                  <Label htmlFor="sensorUnit">Unit (Auto-derived)</Label>
                  <Input id="sensorUnit" {...form.register("unit")} readOnly className="bg-muted/50" disabled={isSubmitting} />
                   {form.formState.errors.unit && <p className="text-sm text-destructive mt-1">{form.formState.errors.unit.message}</p>}
                </div>
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
                <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
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
    </AppLayout>
  );
}
