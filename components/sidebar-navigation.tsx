"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { 
  Home, 
  BarChart3, 
  BookOpen, 
  Settings, 
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  LogOut
} from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import type { User } from "@supabase/supabase-js"

interface SidebarNavigationProps {
  user: User | null
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

interface NavigationItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const navigationItems: NavigationItem[] = [
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
  {
    href: "/settings",
    label: "设置",
    icon: Settings,
  },
]

export default function SidebarNavigation({ 
  user: initialUser,
  isCollapsed = false, 
  onToggleCollapse 
}: SidebarNavigationProps) {
  const pathname = usePathname()
  const [user, setUser] = useState(initialUser)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)

  useEffect(() => {
    setUser(initialUser)
  }, [initialUser])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setAvatarUrl(null)
        setUserName(null)
        return
      }
      
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url, full_name, username')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setAvatarUrl(profile.avatar_url)
          setUserName(profile.full_name || profile.username)
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      }
    }

    fetchUserProfile()
  }, [user])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setAvatarUrl(null)
      setUserName(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const getInitials = (email: string, name?: string | null) => {
    if (name) {
      return name.charAt(0).toUpperCase()
    }
    return email.charAt(0).toUpperCase()
  }

  // 移除这个条件，让侧边栏对所有用户可见

  return (
    <div className={cn(
      "fixed left-0 top-0 h-full bg-white/95 backdrop-blur-sm border-r border-gray-200 z-40 transition-all duration-300 ease-in-out",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/logo.png"
                alt="FutureU Logo"
                width={140}
                height={40}
                className="object-contain"
              />
            </Link>
          )}
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="p-1 h-8 w-8"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* User Status */}
      <div className="p-4 border-b border-gray-200">
        {user ? (
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={avatarUrl || ''} alt={userName || user.email} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {getInitials(user.email || '', userName)}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">
                  {userName || user.email}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {userName ? user.email : 'FutureU 用户'}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            {!isCollapsed ? (
              <div className="space-y-3">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <UserIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">解锁全部功能</h3>
                  <p className="text-xs text-gray-500 mt-1">登录以保存您的练习记录并查看详细学习报告</p>
                </div>
                <Button 
                  onClick={() => window.location.href = '/auth/login'}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  size="sm"
                >
                  登录 / 注册
                </Button>
              </div>
            ) : (
              <div className="w-10 h-10 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200",
                  isActive 
                    ? "bg-blue-50 text-blue-700 border border-blue-200" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}>
                  <Icon className={cn(
                    "w-5 h-5 flex-shrink-0",
                    isActive ? "text-blue-600" : "text-gray-500"
                  )} />
                  {!isCollapsed && (
                    <>
                      <span className="font-medium">{item.label}</span>
                      {item.badge && (
                        <Badge 
                          variant="secondary" 
                          className="ml-auto bg-orange-100 text-orange-700 text-xs px-2 py-0.5"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Logout Button - Only show when user is logged in */}
      {user && (
        <div className="p-4 border-t border-gray-200">
          <Button
              variant="ghost"
              onClick={handleLogout}
              className={cn(
                "w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50",
                isCollapsed ? "px-2" : "px-3"
              )}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="ml-3">退出登录</span>}
            </Button>
        </div>
      )}
    </div>
  )
}