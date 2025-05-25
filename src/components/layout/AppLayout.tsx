
"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  useSidebar,
} from '@/components/ui/sidebar';
import AppLogo from '@/components/AppLogo';
import SettingsPanel from '@/components/settings/SettingsPanel';
import { Home, HardDrive, Cpu, BarChart3, PanelLeft } from 'lucide-react';

// Helper component to use useSidebar hook for AppLogo
const SidebarLogoWrapper = () => {
  const { state } = useSidebar();
  return <AppLogo collapsed={state === 'collapsed'} />;
};

interface AppLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
}

export default function AppLayout({ children, pageTitle }: AppLayoutProps) {
  const pathname = usePathname();

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar collapsible="icon" className="border-r bg-sidebar text-sidebar-foreground">
        <ShadSidebarHeader className="p-0">
          <SidebarLogoWrapper />
        </ShadSidebarHeader>
        <ShadSidebarContent className="p-2 flex flex-col">
          <SidebarMenu className="flex-grow">
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === '/'} 
                className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                tooltip={{ children: "Dashboard", side: "right", align: "center" }}
              >
                <Link href="/"><Home size={18} /> <span>Dashboard</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === '/devices'} 
                className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                tooltip={{ children: "Devices", side: "right", align: "center" }}
              >
                <Link href="/devices"><HardDrive size={18} /> <span>Devices</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === '/sensors'} 
                className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                tooltip={{ children: "Sensors", side: "right", align: "center" }}
              >
                <Link href="/sensors"><Cpu size={18} /> <span>Sensors</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === '/charts'} 
                className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                tooltip={{ children: "Charts", side: "right", align: "center" }}
              >
                <Link href="/charts"><BarChart3 size={18} /> <span>Charts</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <div className="mt-auto">
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
          <h1 className="text-xl font-semibold text-foreground">{pageTitle}</h1>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-4 sm:px-6 md:gap-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
