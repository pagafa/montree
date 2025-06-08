
'use client';

import { useState } from 'react';
import { usePassword } from '@/context/PasswordContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound } from 'lucide-react';
import AppLogo from '@/components/AppLogo';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = usePassword();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!login(password)) {
      setError('Invalid password. Please try again.');
    }
    // If login is successful, the AppLayout will re-render and show the main content
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 p-4">
      <Card className="w-full max-w-md shadow-2xl rounded-xl bg-card/90 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto">
            {/* Using AppLogo with sidebar-like colors for consistency */}
             <div className="flex items-center justify-center gap-2 p-2 text-card-foreground">
                <KeyRound className="h-10 w-10 text-primary" />
                <h1 className="text-3xl font-bold tracking-tight">Sensor Insights</h1>
            </div>
          </div>
          <CardTitle className="text-2xl font-semibold">Access Required</CardTitle>
          <CardDescription className="text-muted-foreground">
            Please enter the site password to continue.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 px-8 py-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password"
                className="text-base h-12 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-destructive text-center font-medium">{error}</p>}
          </CardContent>
          <CardFooter className="px-8 pb-8">
            <Button type="submit" className="w-full h-12 text-lg font-semibold rounded-lg">
              Unlock Application
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
