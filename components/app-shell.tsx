"use client";

import { useState, useCallback } from 'react';
import SidebarNavigation from '@/components/sidebar-navigation';
import { cn } from '@/lib/utils';
import type { User } from "@supabase/supabase-js";

interface AppShellProps {
  user: User | null;
  children: React.ReactNode;
}

export default function AppShell({ user, children }: AppShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
      <SidebarNavigation
        user={user}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />
      <main className={cn(
        "flex-1 transition-all duration-300 ease-in-out",
        isCollapsed ? "ml-16" : "ml-64"
      )}>
        {children}
      </main>
    </div>
  );
}