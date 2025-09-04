"use client";

import { useState, useCallback, useEffect } from 'react';
import SidebarNavigation from '@/components/sidebar-navigation';
import BottomNavigation from '@/components/bottom-navigation';
import { cn } from '@/lib/utils';
import type { User } from "@supabase/supabase-js";
import { useMediaQuery } from '@/hooks/use-media-query';

interface AppShellProps {
  user: User | null;
  children: React.ReactNode;
}

export default function AppShell({ user, children }: AppShellProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [isCollapsed, setIsCollapsed] = useState(!isDesktop);

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  useEffect(() => {
    setIsCollapsed(!isDesktop);
  }, [isDesktop]);

  return (
    <div className="flex min-h-screen">
      {isDesktop ? (
        <SidebarNavigation
          user={user}
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
      ) : (
        <BottomNavigation user={user} />
      )}
      <main className={cn(
        "flex-1 transition-all duration-300 ease-in-out",
        isDesktop ? (isCollapsed ? "ml-16" : "ml-56") : "pb-16"
      )}>
        {children}
      </main>
    </div>
  );
}