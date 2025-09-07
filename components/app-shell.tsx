"use client";

import { useState, useCallback, useEffect } from 'react';
import SidebarNavigation from '@/components/sidebar-navigation';
import BottomNavigation from '@/components/bottom-navigation';
import { cn } from '@/lib/utils';
import type { User } from "@supabase/supabase-js";
import { useMediaQuery } from '@/hooks/use-media-query';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';

interface AppShellProps {
  user: User | null;
  children: React.ReactNode;
}

export default function AppShell({ user, children }: AppShellProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [isSidebarOpen, setIsSidebarOpen] = useState(isDesktop);
  const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), []);
  const handleOpen = useCallback(() => {
    setIsSidebarOpen(true);
  }, []);
  const handleClose = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);
  useEffect(() => {
    setIsSidebarOpen(isDesktop);
  }, [isDesktop]);

  return (
    <div className="flex min-h-screen">
      <main className={cn(
        "flex-1 transition-all duration-300 ease-in-out",
        isDesktop ? "mr-0" : "pb-16"
      )}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
        {isDesktop && (
          <button
            onClick={toggleSidebar}
            className="fixed top-4 right-4 z-50 p-2 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-100"
          >
            {isSidebarOpen ? <ChevronsRight className="w-5 h-5 text-gray-600" /> : <ChevronsLeft className="w-5 h-5 text-gray-600" />}
          </button>
        )}
      </main>
      {isDesktop ? (
        <SidebarNavigation
          user={user}
          isCollapsed={!isSidebarOpen}
          onToggleCollapse={toggleSidebar}
        />
      ) : (
        <BottomNavigation user={user} />
      )}
    </div>
  );
}