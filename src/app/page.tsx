
"use client"
import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import SummarySection from '@/components/dashboard/SummarySection';
import SensorDataTable from '@/components/dashboard/SensorDataTable';
import type { SensorData, DBSensor, ManagedDevice, ApiRequestLog } from '@/types';
import { getSensors as getAllDbSensors } from '@/app/sensors/actions';
import { getDevices as getAllDbDevices } from '@/app/devices/actions';
import { getApiRequestLogs, clearApiRequestLogs } from '@/app/logs/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Info, AlertTriangle, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

// Helper to map DBSensor to SensorData for UI display on dashboard
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


export default function DashboardPage() {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [devices, setDevices] = useState<ManagedDevice[]>([]);
  const [apiRequestLogs, setApiRequestLogs] = useState<ApiRequestLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [isClearingLogs, setIsClearingLogs] = useState(false);
  const { toast } = useToast();
  const [apiUrl, setApiUrl] = useState('');

  useEffect(() => {
    setApiUrl(`${window.location.origin}/api/ingest-readings`);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedDbSensors, fetchedDevices] = await Promise.all([
        getAllDbSensors(),
        getAllDbDevices()
      ]);
      
      const sensorsForDashboard = fetchedDbSensors.map(mapDbSensorToUi);
      setSensorData(sensorsForDashboard);
      setDevices(fetchedDevices);

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast({ title: "Error", description: "Could not load dashboard data.", variant: "destructive" });
      setSensorData([]);
      setDevices([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchApiLogs = useCallback(async () => {
    setIsLoadingLogs(true);
    try {
      const logs = await getApiRequestLogs(20); // Fetch last 20 logs
      setApiRequestLogs(logs);
    } catch (error) {
      console.error("Failed to fetch API request logs:", error);
      toast({ title: "Error", description: "Could not load API request logs.", variant: "destructive" });
      setApiRequestLogs([]);
    } finally {
      setIsLoadingLogs(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboardData();
    fetchApiLogs();
  }, [fetchDashboardData, fetchApiLogs]);

  const handleClearLogs = async () => {
    setIsClearingLogs(true);
    const result = await clearApiRequestLogs();
    if (result.success) {
      toast({ title: "Success", description: result.message });
      fetchApiLogs(); // Refresh logs
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
    setIsClearingLogs(false);
  };


  if (isLoading) {
    return (
      <AppLayout pageTitle="Dashboard Overview">
        <div className="flex h-[calc(100vh-theme(spacing.28))] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Loading dashboard data...</p>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout pageTitle="Dashboard Overview">
      <Card className="mb-6 shadow-lg rounded-lg border border-border p-4">
        <div className="flex items-center mb-2">
          <Info className="h-5 w-5 mr-2 text-primary" />
          <CardTitle className="text-lg">Device Data Ingestion API</CardTitle>
        </div>
        {apiUrl ? (
          <>
            <p className="text-sm text-muted-foreground">
              Your devices should send POST requests to the following URL:
            </p>
            <div className="mt-2 p-3 bg-muted rounded-md">
              <code className="text-sm font-mono text-foreground break-all">{apiUrl}</code>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Loading API endpoint URL...</p>
        )}
        <p className="text-xs text-muted-foreground mt-3">
          Expected JSON payload format:
        </p>
        <pre className="mt-1 p-2 bg-muted/50 rounded-md text-xs font-mono text-foreground overflow-x-auto">
          {`{
  "device_id": "your-device-userVisibleId",
  "timestamp": "YYYY-MM-DDTHH:mm:ssZ",
  "readings": [
    {"channel": 1, "type": "Temperature", "value": 23.5},
    // ... more readings ...
  ]
}`}
        </pre>
         <p className="text-xs text-muted-foreground mt-3">
            Note: \`device_id\` must match a registered device's User Visible ID. \`channel\` is 1-8. \`type\` should be PascalCase (e.g., "Temperature", "CO2").
        </p>
      </Card>

      <SummarySection sensorData={sensorData} deviceCount={devices.length} />
      
      <div className="grid auto-rows-max items-start gap-6 md:gap-8 lg:grid-cols-1">
        <Card className="lg:col-span-1 shadow-md rounded-lg">
          <CardHeader>
            <CardTitle>Sensor Activity Overview</CardTitle>
            <CardDescription>A quick look at recent sensor data from various devices.</CardDescription>
          </CardHeader>
          <CardContent>
            <SensorDataTable data={sensorData} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 shadow-md rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Invalid API Requests</CardTitle>
              <CardDescription>Log of the last 20 incorrect requests made to the ingestion API.</CardDescription>
            </div>
            {apiRequestLogs.length > 0 && (
               <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isClearingLogs}>
                    {isClearingLogs ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Clear Logs
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will permanently delete all API request logs. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isClearingLogs}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearLogs}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={isClearingLogs}
                    >
                      {isClearingLogs ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Delete All Logs
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardHeader>
          <CardContent>
            {isLoadingLogs ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Loading API request logs...</p>
              </div>
            ) : apiRequestLogs.length > 0 ? (
              <div className="rounded-md border max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Timestamp</TableHead>
                      <TableHead>Device ID Att.</TableHead>
                      <TableHead>Error Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiRequestLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs">{format(parseISO(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                        <TableCell className="text-xs font-mono">{log.device_id_attempted || 'N/A'}</TableCell>
                        <TableCell className="text-xs">{log.error_type}</TableCell>
                        <TableCell className="text-xs">{log.status_code_returned}</TableCell>
                        <TableCell className="text-xs text-right">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm">View</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="max-w-2xl">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Log Details (ID: {log.id})</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Timestamp: {format(parseISO(log.timestamp), 'PPpp')}
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <div className="mt-2 space-y-2 text-sm max-h-[60vh] overflow-y-auto">
                                        <p><strong>IP Address:</strong> {log.ip_address || 'N/A'}</p>
                                        <p><strong>Method:</strong> {log.method}</p>
                                        <p><strong>Path:</strong> {log.path}</p>
                                        <p><strong>Device ID Attempted:</strong> {log.device_id_attempted || 'N/A'}</p>
                                        <p><strong>Error Type:</strong> {log.error_type}</p>
                                        <p><strong>Status Code:</strong> {log.status_code_returned}</p>
                                        <div>
                                            <strong>Error Details:</strong>
                                            <pre className="mt-1 p-2 bg-muted/50 rounded-md text-xs font-mono whitespace-pre-wrap break-all">{log.error_details || 'N/A'}</pre>
                                        </div>
                                        <div>
                                            <strong>Payload Received:</strong>
                                            <pre className="mt-1 p-2 bg-muted/50 rounded-md text-xs font-mono whitespace-pre-wrap break-all">{log.payload_received || 'N/A'}</pre>
                                        </div>
                                    </div>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Close</AlertDialogCancel>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <AlertTriangle size={32} className="mb-2 text-primary" />
                <p className="font-semibold">No invalid API requests logged yet.</p>
                <p className="text-sm">All recent API requests were successful or no requests have been made.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
