"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, Home, BarChart3, BookOpen, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";

interface SidebarNavigationProps {
  user: User | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const navigationItems = [
  {
    href: "/",
    label: "主页",
    icon: Home,
  },
  {
    href: "/learning-report",
    label: "学习报告",
    icon: BarChart3,
  },
  {
    href: "/practice-history",
    label: "练习记录",
    icon: BookOpen,
  },
];

export default function SidebarNavigation({ user, isCollapsed, onToggleCollapse }: SidebarNavigationProps) {
  const pathname = usePathname();

  return (
    <aside className={cn(
      "fixed top-0 left-0 h-full bg-white border-r border-gray-200 transition-all duration-300 ease-in-out z-50",
      isCollapsed ? "w-16" : "w-56"
    )}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {!isCollapsed && (
            <Link href="/" className="flex items-center gap-2">
              <span className="text-lg font-semibold text-gray-800">FutureU</span>
            </Link>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            {isCollapsed ? <ChevronsRight className="w-5 h-5 text-gray-600" /> : <ChevronsLeft className="w-5 h-5 text-gray-600" />}
          </button>
        </div>
        <nav className="flex-1 mt-4 space-y-1 px-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center h-10 px-3 rounded-md transition-colors duration-200",
                  isActive
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                  isCollapsed && "justify-center"
                )}
              >
                <Icon className={cn("w-5 h-5", !isCollapsed && "mr-3")} />
                {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-gray-200 p-2">
          <Link
            href="/settings"
            className={cn(
              "flex items-center h-10 px-3 rounded-md transition-colors duration-200",
              pathname === "/settings"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
              isCollapsed && "justify-center"
            )}
          >
            <Settings className={cn("w-5 h-5", !isCollapsed && "mr-3")} />
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-medium">设置</span>
              </div>
            )}
          </Link>
        </div>
      </div>
    </aside>
  );
}