
"use client";
import React, { useState, useEffect, useCallback } from 'react';
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
import type { ManagedDevice } from '@/types';
import { HardDrive, PlusCircle, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getDevices, addDevice, updateDevice, deleteDevice } from './actions';

const deviceFormSchema = z.object({
  userVisibleId: z.string().min(1, "Device ID is required"),
  name: z.string().min(1, "Device name is required"),
});
type DeviceFormValues = z.infer<typeof deviceFormSchema>;

export default function DevicesPage() {
  const [devices, setDevices] = useState<ManagedDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<ManagedDevice | null>(null);
  const { toast } = useToast();

  const form = useForm<DeviceFormValues>({
    resolver: zodResolver(deviceFormSchema),
    defaultValues: { userVisibleId: '', name: '' },
  });

  const fetchDevices = useCallback(async () => {
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

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleAddDevice = () => {
    form.reset({
      userVisibleId: `DEV-${(Math.floor(Math.random() * 900) + 100)}`, // Suggest a random ID
      name: ''
    });
    setIsAddDialogOpen(true);
  };

  const handleEditDevice = (device: ManagedDevice) => {
    setCurrentDevice(device);
    form.reset({ userVisibleId: device.userVisibleId, name: device.name });
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
      // setDevices(prev => [result.device!, ...prev].sort((a,b) => a.name.localeCompare(b.name))); // Optimistic update
      await fetchDevices(); // Re-fetch to ensure consistency
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
        // setDevices(prev => prev.map(d => d.id === currentDevice.id ? { ...result.device! } : d).sort((a,b) => a.name.localeCompare(b.name)));
        await fetchDevices();
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
        // setDevices(prev => prev.filter(d => d.id !== currentDevice.id));
        await fetchDevices();
        setIsDeleteDialogOpen(false);
        toast({ title: "Device Deleted", description: `Device "${currentDevice.name}" has been deleted.`, variant: "destructive" });
      } else {
        toast({ title: "Error", description: result.message || "Failed to delete device.", variant: "destructive" });
      }
    }
  };

  return (
    <AppLayout pageTitle="Device Management">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Manage Devices</h2>
        <Button onClick={handleAddDevice} disabled={isLoading}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Device
        </Button>
      </div>
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
    </AppLayout>
  );
}
