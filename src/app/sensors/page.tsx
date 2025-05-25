
"use client";
import React, { useState, useEffect } from 'react';
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
import { generateSensorData, SENSOR_TYPES_ARRAY, DEVICE_NAMES_ARRAY, SENSOR_NAMES_ARRAY } from '@/lib/mock-data';
import type { SensorData } from '@/types';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const sensorFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Sensor name is required"),
  type: z.enum(SENSOR_TYPES_ARRAY),
  value: z.coerce.number().min(0, "Value must be non-negative"),
  unit: z.string().min(1, "Unit is required"),
  device: z.string().min(1, "Device assignment is required"),
});
type SensorFormValues = z.infer<typeof sensorFormSchema>;

const UNITS_OPTIONS: { [key in SensorData['type']]: string } = {
  Temperature: '°C',
  Humidity: '%',
  Pressure: 'hPa',
  Light: 'lux',
  Motion: 'detections',
  Generic: 'units'
};

export default function SensorsPage() {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentSensor, setCurrentSensor] = useState<SensorData | null>(null);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const { toast } = useToast();

  const form = useForm<SensorFormValues>({
    resolver: zodResolver(sensorFormSchema),
  });

 useEffect(() => {
    const sData = generateSensorData(50); 
    setSensorData(sData);
    setIsLoading(false);
  }, []);
  
  useEffect(() => {
    if (dialogMode === 'edit' && currentSensor) {
      form.reset({
        id: currentSensor.id,
        name: currentSensor.name,
        type: currentSensor.type,
        value: currentSensor.value,
        unit: currentSensor.unit,
        device: currentSensor.device,
      });
    } else {
      form.reset({
        id: undefined,
        name: SENSOR_NAMES_ARRAY[Math.floor(Math.random() * SENSOR_NAMES_ARRAY.length)], // Default name
        type: SENSOR_TYPES_ARRAY[0],
        value: 0,
        unit: UNITS_OPTIONS[SENSOR_TYPES_ARRAY[0]],
        device: DEVICE_NAMES_ARRAY[0],
      });
    }
  }, [isFormDialogOpen, dialogMode, currentSensor, form]);

  // Update unit when type changes
  const watchedType = form.watch("type");
  useEffect(() => {
    if (watchedType) {
      form.setValue("unit", UNITS_OPTIONS[watchedType]);
    }
  }, [watchedType, form]);


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

  const onSubmit = (data: SensorFormValues) => {
    const newSensorData = {
      ...data,
      id: dialogMode === 'add' ? crypto.randomUUID() : currentSensor!.id,
      timestamp: new Date(), // Update timestamp on edit/add
    } as SensorData;

    if (dialogMode === 'add') {
      setSensorData(prev => [newSensorData, ...prev]);
      toast({ title: "Sensor Added", description: `Sensor "${data.name}" has been added.` });
    } else {
      setSensorData(prev => prev.map(s => s.id === currentSensor!.id ? newSensorData : s));
      toast({ title: "Sensor Updated", description: `Sensor "${data.name}" has been updated.` });
    }
    setIsFormDialogOpen(false);
  };

  const onConfirmDelete = () => {
    if (currentSensor) {
      setSensorData(prev => prev.filter(s => s.id !== currentSensor.id));
      setIsDeleteDialogOpen(false);
      toast({ title: "Sensor Deleted", description: `Sensor "${currentSensor.name}" has been deleted.`, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <AppLayout pageTitle="Sensor Management">
        <div className="flex h-[calc(100vh-theme(spacing.28))] w-full items-center justify-center">
          <p>Loading sensors...</p>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout pageTitle="Sensor Management">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Manage Sensors</h2>
        <Button onClick={handleAddSensor}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Sensor
        </Button>
      </div>
      <Card className="shadow-md rounded-lg">
        <CardHeader>
          <CardTitle>All Sensors</CardTitle>
          <CardDescription>
            Detailed list of all sensor readings. Changes are client-side and will be lost on refresh.
            New devices added on the 'Devices' page won't appear in the 'Device' dropdown here without a page refresh.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SensorDataTable data={sensorData} onEditSensor={handleEditSensor} onDeleteSensor={handleDeleteSensor} />
        </CardContent>
      </Card>

      {/* Add/Edit Sensor Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{dialogMode === 'add' ? 'Add New Sensor' : 'Edit Sensor'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sensorName">Sensor Name</Label>
                <Input id="sensorName" {...form.register("name")} />
                {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="sensorType">Sensor Type</Label>
                <Controller
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sensorValue">Value</Label>
                <Input id="sensorValue" type="number" step="0.01" {...form.register("value")} />
                {form.formState.errors.value && <p className="text-sm text-destructive mt-1">{form.formState.errors.value.message}</p>}
              </div>
              <div>
                <Label htmlFor="sensorUnit">Unit</Label>
                <Input id="sensorUnit" {...form.register("unit")} readOnly className="bg-muted/50" />
                 {form.formState.errors.unit && <p className="text-sm text-destructive mt-1">{form.formState.errors.unit.message}</p>}
              </div>
            </div>
             <div>
              <Label htmlFor="sensorDevice">Device</Label>
              <Controller
                  control={form.control}
                  name="device"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="sensorDevice">
                        <SelectValue placeholder="Select device" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEVICE_NAMES_ARRAY.map(device => <SelectItem key={device} value={device}>{device}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
              {form.formState.errors.device && <p className="text-sm text-destructive mt-1">{form.formState.errors.device.message}</p>}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">{dialogMode === 'add' ? 'Add Sensor' : 'Save Changes'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Sensor Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the sensor "{currentSensor?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
