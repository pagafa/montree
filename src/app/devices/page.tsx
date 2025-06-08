
"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ManagedDevice, ApiRequestLog } from '@/types';
import { HardDrive, PlusCircle, Pencil, Trash2, Loader2, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getDevices, addDevice, updateDevice, deleteDevice } from './actions';
import { getUnregisteredDeviceOrSensorAttempts, clearApiRequestLogs } from '@/app/logs/actions';

const deviceFormSchema = z.object({
  userVisibleId: z.string().min(1, "Device ID is required"),
  name: z.string().min(1, "Device name is required"),
});
type DeviceFormValues = z.infer<typeof deviceFormSchema>;

interface UnregisteredDeviceAttempt {
  userVisibleId: string;
  lastAttempt: string; 
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<ManagedDevice[]>([]);
  const [unregisteredAttempts, setUnregisteredAttempts] = useState<UnregisteredDeviceAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isClearLogsDialogOpen, setIsClearLogsDialogOpen] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<ManagedDevice | null>(null);
  const { toast } = useToast();

  const form = useForm<DeviceFormValues>({
    resolver: zodResolver(deviceFormSchema),
    defaultValues: { userVisibleId: '', name: '' },
  });

  const fetchDeviceData = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedDevices = await getDevices();
      setDevices(fetchedDevices);
    } catch (error) {
      console.error("Failed to fetch devices:", error);
      toast({ title: "Error", description: "Could not load devices.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchUnregisteredAttempts = useCallback(async (currentDevices: ManagedDevice[]) => {
    setIsLoadingLogs(true);
    try {
      const logs = await getUnregisteredDeviceOrSensorAttempts(50); // Fetch more logs to ensure we get device not found errors
      const deviceNotFoundLogs = logs.filter(log => log.error_type === 'Device Not Found' && log.device_id_attempted);
      
      const registeredDeviceIds = new Set(currentDevices.map(d => d.userVisibleId));
      
      const attemptsMap = new Map<string, UnregisteredDeviceAttempt>();

      deviceNotFoundLogs.forEach(log => {
        if (log.device_id_attempted && !registeredDeviceIds.has(log.device_id_attempted)) {
          const existing = attemptsMap.get(log.device_id_attempted);
          if (!existing || new Date(log.timestamp) > new Date(existing.lastAttempt)) {
            attemptsMap.set(log.device_id_attempted, {
              userVisibleId: log.device_id_attempted,
              lastAttempt: log.timestamp,
            });
          }
        }
      });
      setUnregisteredAttempts(Array.from(attemptsMap.values()).sort((a,b) => new Date(b.lastAttempt).getTime() - new Date(a.lastAttempt).getTime()));

    } catch (error) {
      console.error("Failed to fetch unregistered device attempts:", error);
      toast({ title: "Error", description: "Could not load unregistered device attempts.", variant: "destructive" });
    } finally {
      setIsLoadingLogs(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDeviceData();
  }, [fetchDeviceData]);

  useEffect(() => {
    if (!isLoading) { // Only fetch attempts after devices are loaded
        fetchUnregisteredAttempts(devices);
    }
  }, [isLoading, devices, fetchUnregisteredAttempts]);


  const handleAddDevice = (prefillId?: string) => {
    form.reset({
      userVisibleId: prefillId || `DEV-${(Math.floor(Math.random() * 900) + 100)}`,
      name: ''
    });
    form.clearErrors();
    setIsAddDialogOpen(true);
  };

  const handleEditDevice = (device: ManagedDevice) => {
    setCurrentDevice(device);
    form.reset({ userVisibleId: device.userVisibleId, name: device.name });
    form.clearErrors();
    setIsEditDialogOpen(true);
  };

  const handleDeleteDevice = (device: ManagedDevice) => {
    setCurrentDevice(device);
    setIsDeleteDialogOpen(true);
  };

  const onAddSubmit = async (data: DeviceFormValues) => {
    setIsSubmitting(true);
    form.clearErrors();
    const result = await addDevice(data);
    setIsSubmitting(false);

    if (result.success && result.device) {
      await fetchDeviceData(); // Re-fetch to ensure consistency and update unregistered list
      setIsAddDialogOpen(false);
      toast({ title: "Device Added", description: `Device "${data.name}" has been added.` });
    } else {
      if (result.errorField) {
        form.setError(result.errorField, { type: "manual", message: result.message });
      } else {
        toast({ title: "Error", description: result.message || "Failed to add device.", variant: "destructive" });
      }
    }
  };

  const onEditSubmit = async (data: DeviceFormValues) => {
    if (currentDevice) {
      setIsSubmitting(true);
      form.clearErrors();
      const result = await updateDevice(currentDevice.id, data);
      setIsSubmitting(false);

      if (result.success && result.device) {
        await fetchDeviceData();
        setIsEditDialogOpen(false);
        toast({ title: "Device Updated", description: `Device "${data.name}" has been updated.` });
      } else {
         if (result.errorField) {
          form.setError(result.errorField, { type: "manual", message: result.message });
        } else {
          toast({ title: "Error", description: result.message || "Failed to update device.", variant: "destructive" });
        }
      }
    }
  };

  const onConfirmDelete = async () => {
    if (currentDevice) {
      setIsSubmitting(true);
      const result = await deleteDevice(currentDevice.id);
      setIsSubmitting(false);

      if (result.success) {
        await fetchDeviceData();
        setIsDeleteDialogOpen(false);
        toast({ title: "Device Deleted", description: `Device "${currentDevice.name}" has been deleted.`, variant: "destructive" });
      } else {
        toast({ title: "Error", description: result.message || "Failed to delete device.", variant: "destructive" });
      }
    }
  };

  const handleClearLogs = async () => {
    setIsSubmitting(true);
    const result = await clearApiRequestLogs();
    setIsSubmitting(false);
    if (result.success) {
      toast({ title: "Logs Cleared", description: result.message });
      await fetchUnregisteredAttempts(devices); // Re-fetch to clear the list
    } else {
      toast({ title: "Error", description: result.message || "Failed to clear logs.", variant: "destructive" });
    }
    setIsClearLogsDialogOpen(false);
  };


  return (
    <AppLayout pageTitle="Device Management">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Manage Devices</h2>
        <Button onClick={() => handleAddDevice()} disabled={isLoading}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Device
        </Button>
      </div>

      {/* Unregistered Device Attempts Card */}
      <Card className="mb-6 shadow-md rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                    Unregistered Device IDs
                </CardTitle>
                <CardDescription>Device IDs that attempted to send data but are not registered.</CardDescription>
            </div>
            {unregisteredAttempts.length > 0 && (
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
            ) : unregisteredAttempts.length > 0 ? (
                 <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Attempted Device ID</TableHead>
                            <TableHead>Last Attempt</TableHead>
                            <TableHead className="text-right w-[120px]">Action</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {unregisteredAttempts.map((attempt) => (
                            <TableRow key={attempt.userVisibleId}>
                            <TableCell className="font-mono text-xs">{attempt.userVisibleId}</TableCell>
                            <TableCell>{new Date(attempt.lastAttempt).toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="default" size="sm" onClick={() => handleAddDevice(attempt.userVisibleId)}>
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
                    No unregistered device attempts found in recent logs.
                </div>
            )}
        </CardContent>
      </Card>


      <Card className="shadow-md rounded-lg">
        <CardHeader>
          <CardTitle>All Registered Devices</CardTitle>
          <CardDescription>
            List of all devices stored in the database. Changes are persistent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading devices...</p>
            </div>
          ) : devices.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device ID</TableHead>
                    <TableHead>Device Name</TableHead>
                    <TableHead className="text-right w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell className="font-mono text-xs">{device.userVisibleId}</TableCell>
                      <TableCell className="font-medium">
                        <HardDrive className="h-4 w-4 mr-2 inline-block text-muted-foreground" />
                        {device.name}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEditDevice(device)} className="mr-2" disabled={isSubmitting}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteDevice(device)} disabled={isSubmitting}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-10 text-center">No devices found. Click "Add New Device" to start.</p>
          )}
        </CardContent>
      </Card>

      {/* Add Device Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(isOpen) => { if (!isSubmitting) setIsAddDialogOpen(isOpen); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Device</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onAddSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="userVisibleDeviceId">Device ID</Label>
              <Input id="userVisibleDeviceId" {...form.register("userVisibleId")} disabled={isSubmitting} />
              {form.formState.errors.userVisibleId && <p className="text-sm text-destructive mt-1">{form.formState.errors.userVisibleId.message}</p>}
            </div>
            <div>
              <Label htmlFor="deviceName">Device Name</Label>
              <Input id="deviceName" {...form.register("name")} disabled={isSubmitting} />
              {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Device
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Device Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => { if (!isSubmitting) setIsEditDialogOpen(isOpen); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Device</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
             <div>
              <Label htmlFor="editUserVisibleDeviceId">Device ID</Label>
              <Input id="editUserVisibleDeviceId" {...form.register("userVisibleId")} disabled={isSubmitting} />
              {form.formState.errors.userVisibleId && <p className="text-sm text-destructive mt-1">{form.formState.errors.userVisibleId.message}</p>}
            </div>
            <div>
              <Label htmlFor="editDeviceName">Device Name</Label>
              <Input id="editDeviceName" {...form.register("name")} disabled={isSubmitting} />
              {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Device Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(isOpen) => { if (!isSubmitting) setIsDeleteDialogOpen(isOpen); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the device "{currentDevice?.name}" and all its associated sensors.
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

