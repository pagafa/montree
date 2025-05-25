
"use client";
import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function ChartsPage() {
  return (
    <AppLayout pageTitle="Sensor Charts">
      <Card className="shadow-md rounded-lg">
        <CardHeader>
          <CardTitle>Charts & Visualizations</CardTitle>
          <CardDescription>Visual representation of sensor data trends and patterns.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed border-border rounded-lg">
            <BarChart3 size={48} className="mb-4 text-primary" />
            <p className="text-lg font-semibold">Sensor Charts Coming Soon</p>
            <p className="text-sm">This section is currently under development. Check back later for insightful data visualizations!</p>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
