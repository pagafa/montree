
"use client";
import React, { useState, useEffect } from 'react';
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
import { generateInitialDeviceList } from '@/lib/mock-data';
import type { ManagedDevice } from '@/types';
import { HardDrive, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const deviceFormSchema = z.object({
  name: z.string().min(1, "Device name is required"),
});
type DeviceFormValues = z.infer<typeof deviceFormSchema>;

export default function DevicesPage() {
  const [devices, setDevices] = useState<ManagedDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<ManagedDevice | null>(null);
  const { toast } = useToast();

  const form = useForm<DeviceFormValues>({
    resolver: zodResolver(deviceFormSchema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    setDevices(generateInitialDeviceList());
    setIsLoading(false);
  }, []);

  const handleAddDevice = () => {
    form.reset({ name: '' });
    setIsAddDialogOpen(true);
  };

  const handleEditDevice = (device: ManagedDevice) => {
    setCurrentDevice(device);
    form.reset({ name: device.name });
    setIsEditDialogOpen(true);
  };

  const handleDeleteDevice = (device: ManagedDevice) => {
    setCurrentDevice(device);
    setIsDeleteDialogOpen(true);
  };

  const onAddSubmit = (data: DeviceFormValues) => {
    const newDevice: ManagedDevice = { id: crypto.randomUUID(), name: data.name };
    setDevices(prev => [newDevice, ...prev].sort((a,b) => a.name.localeCompare(b.name)));
    setIsAddDialogOpen(false);
    toast({ title: "Device Added", description: `Device "${data.name}" has been added.` });
  };

  const onEditSubmit = (data: DeviceFormValues) => {
    if (currentDevice) {
      setDevices(prev => prev.map(d => d.id === currentDevice.id ? { ...d, name: data.name } : d).sort((a,b) => a.name.localeCompare(b.name)));
      setIsEditDialogOpen(false);
      toast({ title: "Device Updated", description: `Device "${data.name}" has been updated.` });
    }
  };

  const onConfirmDelete = () => {
    if (currentDevice) {
      setDevices(prev => prev.filter(d => d.id !== currentDevice.id));
      setIsDeleteDialogOpen(false);
      toast({ title: "Device Deleted", description: `Device "${currentDevice.name}" has been deleted.`, variant: "destructive" });
    }
  };

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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Manage Devices</h2>
        <Button onClick={handleAddDevice}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Device
        </Button>
      </div>
      <Card className="shadow-md rounded-lg">
        <CardHeader>
          <CardTitle>All Registered Devices</CardTitle>
          <CardDescription>
            List of all devices. Changes are client-side and will be lost on refresh.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {devices.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device Name</TableHead>
                    <TableHead className="text-right w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell className="font-medium">
                        <HardDrive className="h-4 w-4 mr-2 inline-block text-muted-foreground" />
                        {device.name}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEditDevice(device)} className="mr-2">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteDevice(device)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No devices found. Click "Add New Device" to start.</p>
          )}
        </CardContent>
      </Card>

      {/* Add Device Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Device</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onAddSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="deviceName">Device Name</Label>
              <Input id="deviceName" {...form.register("name")} />
              {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">Add Device</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Device Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Device</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="editDeviceName">Device Name</Label>
              <Input id="editDeviceName" {...form.register("name")} />
              {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Device Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the device "{currentDevice?.name}".
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
