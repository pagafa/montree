
"use client" // Required for hooks like useSidebar, useTheme and data generation in useEffect if dynamic
import React, { useState, useEffect } from 'react';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarInset, 
  SidebarHeader as ShadSidebarHeader, 
  SidebarContent as ShadSidebarContent, 
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar, // Import useSidebar
} from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLogo from '@/components/AppLogo';
import SettingsPanel from '@/components/settings/SettingsPanel';
import SummarySection from '@/components/dashboard/SummarySection';
import SensorDataTable from '@/components/dashboard/SensorDataTable';
import SensorTimeSeriesChart from '@/components/dashboard/SensorTimeSeriesChart';
import { generateSensorData, generateHistoricalData } from '@/lib/mock-data';
import type { SensorData, SensorReading } from '@/types';
import { Home, BarChart3, TableIcon, Settings, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Helper component to use useSidebar hook for AppLogo
const SidebarLogoWrapper = () => {
  const { state } = useSidebar(); // Get sidebar state
  return <AppLogo collapsed={state === 'collapsed'} />;
}

export default function DashboardPage() {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [historicalData, setHistoricalData] = useState<SensorReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const sData = generateSensorData(10);
    setSensorData(sData);
    if (sData.length > 0) {
      setHistoricalData(generateHistoricalData(sData[0].id, 50));
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <p>Loading dashboard...</p>
      </div>
    );
  }
  
  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar collapsible="icon" className="border-r bg-sidebar text-sidebar-foreground">
        <ShadSidebarHeader className="p-0"> {/* Removed padding to let AppLogo handle it */}
          <SidebarLogoWrapper />
        </ShadSidebarHeader>
        <ShadSidebarContent className="p-2 flex flex-col">
          <SidebarMenu className="flex-grow">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={true} className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground">
                <Link href="#"><Home size={18} /> <span>Dashboard</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                <Link href="#"><TableIcon size={18} /> <span>Data Table</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                <Link href="#"><BarChart3 size={18} /> <span>Charts</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {/* Add more navigation items here */}
          </SidebarMenu>
          <div className="mt-auto"> {/* Pushes settings to bottom */}
             <SettingsPanel />
          </div>
        </ShadSidebarContent>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <SidebarTrigger className="sm:hidden">
             <PanelLeft className="h-5 w-5" />
             <span className="sr-only">Toggle Menu</span>
          </SidebarTrigger>
          <h1 className="text-xl font-semibold text-foreground">Dashboard Overview</h1>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-4 sm:px-6 md:gap-8">
          <SummarySection sensorData={sensorData} />
          <div className="grid auto-rows-max items-start gap-6 md:gap-8 lg:grid-cols-3">
            <Card className="lg:col-span-2 shadow-md rounded-lg">
              <CardHeader>
                <CardTitle>All Sensors</CardTitle>
                <CardDescription>Live overview of all connected sensor devices.</CardDescription>
              </CardHeader>
              <CardContent>
                <SensorDataTable data={sensorData} />
              </CardContent>
            </Card>
            <Card className="lg:col-span-1 shadow-md rounded-lg">
              <CardHeader>
                <CardTitle>Device Activity Trend</CardTitle>
                <CardDescription>
                  {sensorData.length > 0 ? `Time series for ${sensorData[0].name}` : 'No sensor data available'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sensorData.length > 0 && historicalData.length > 0 ? (
                  <SensorTimeSeriesChart data={historicalData} sensorName={sensorData[0].name} />
                ) : (
                  <p className="text-sm text-muted-foreground">No historical data to display chart.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

