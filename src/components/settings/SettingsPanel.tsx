
"use client"

import type { FC } from 'react';
import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { usePassword } from '@/context/PasswordContext';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import React from 'react';

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmNewPassword: z.string().min(6, "Confirm new password is required"),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match",
  path: ["confirmNewPassword"], // Point error to the confirm password field
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

const SettingsPanel: FC = () => {
  const { changePassword } = usePassword();
  const { toast } = useToast();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = React.useState(false);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    }
  });

  const onSubmit: SubmitHandler<PasswordFormValues> = (data) => {
    const result = changePassword(data.currentPassword, data.newPassword);
    if (result.success) {
      toast({
        title: "Password Updated",
        description: result.message,
      });
      form.reset();
      setIsPasswordDialogOpen(false);
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
      if (result.message.toLowerCase().includes("current password incorrect")) {
        form.setError("currentPassword", { type: "manual", message: result.message });
      }
    }
  };

  return (
    <div className="p-4 space-y-6 border-t border-sidebar-border">
      {/* Password Management */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-sidebar-foreground/80">Password</Label>
        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-sidebar-foreground bg-sidebar-accent hover:bg-sidebar-accent/80">
              <KeyRound className="mr-2 h-4 w-4" />
              Change Password
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Change Site Password</DialogTitle>
              <DialogDescription>
                Update the password used to access this application. This change is local to your browser.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  {...form.register("currentPassword")}
                />
                {form.formState.errors.currentPassword && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.currentPassword.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  {...form.register("newPassword")}
                />
                {form.formState.errors.newPassword && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.newPassword.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  {...form.register("confirmNewPassword")}
                />
                {form.formState.errors.confirmNewPassword && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.confirmNewPassword.message}</p>
                )}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline" onClick={() => form.reset()}>Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Saving..." : "Save Password"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SettingsPanel;
