
"use client"

import type { FC } from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTheme } from '@/hooks/use-theme';
import type { DisplayConfig } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


const SettingsPanel: FC = () => {
  const [currentTheme, setTheme] = useTheme();

  return (
    <div className="p-4 space-y-6 border-t border-sidebar-border">
      <div className="space-y-2">
        <Label htmlFor="theme-selector" className="text-sm font-medium text-sidebar-foreground/80">Theme</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-sidebar-foreground bg-sidebar-accent hover:bg-sidebar-accent/80">
                {currentTheme === 'light' && <Sun className="mr-2 h-4 w-4" />}
                {currentTheme === 'dark' && <Moon className="mr-2 h-4 w-4" />}
                {currentTheme === 'system' && <Laptop className="mr-2 h-4 w-4" />}
                {currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover text-popover-foreground">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <Laptop className="mr-2 h-4 w-4" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
      </div>
      {/* Add more settings here */}
    </div>
  );
};

export default SettingsPanel;
