import { BarChart3 } from 'lucide-react';
import type { FC } from 'react';

interface AppLogoProps {
  collapsed?: boolean;
}

const AppLogo: FC<AppLogoProps> = ({ collapsed = false }) => {
  return (
    <div className="flex items-center gap-2 p-2 text-sidebar-foreground">
      <BarChart3 className="h-6 w-6 text-sidebar-primary" />
      {!collapsed && <h1 className="text-lg font-semibold">Sensor Insights</h1>}
    </div>
  );
};

export default AppLogo;
