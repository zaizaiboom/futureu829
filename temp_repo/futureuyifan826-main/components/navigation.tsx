'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Home, User as UserIcon, History, BarChart3, Settings, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface NavigationProps {
  currentPage?: string
}

export default function Navigation({ currentPage }: NavigationProps) {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast.success('已退出登录')
      router.push('/auth/login')
    } catch (error) {
      toast.error('退出登录失败')
    }
  }

  const navigationItems = [
    { href: '/profile', label: '个人资料', icon: UserIcon, key: 'profile' },
    { href: '/practice-history', label: '练习记录', icon: History, key: 'practice-history' },
    { href: '/learning-report', label: '学习报告', icon: BarChart3, key: 'learning-report' },
    { href: '/settings', label: '设置', icon: Settings, key: 'settings' },
  ]

  return (
    <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* 左侧：返回首页 + 当前页面标题 */}
          <div className="flex items-center space-x-4">
            <Link href="/" prefetch={false}>
              <Button
                variant="ghost"
                className="text-gray-600 hover:text-gray-900 flex items-center space-x-2"
              >
                <Home className="w-4 h-4" />
                <span>返回首页</span>
              </Button>
            </Link>
            {currentPage && (
              <>
                <div className="h-6 w-px bg-gray-300" />
                <h1 className="text-xl font-semibold text-gray-900">
                  {navigationItems.find(item => item.key === currentPage)?.label || 'FutureU'}
                </h1>
              </>
            )}
          </div>

          {/* 右侧：导航菜单 + 用户菜单 */}
          <div className="flex items-center space-x-4">
            {/* 导航菜单 */}
            <div className="hidden md:flex items-center space-x-2">
              {navigationItems.map((item) => {
                const IconComponent = item.icon
                const isActive = currentPage === item.key
                return (
                  <Link key={item.key} href={item.href} prefetch={false}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <IconComponent className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                )
              })}
            </div>

            {/* 用户菜单 */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email || ''} />
                      <AvatarFallback>
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">{user.user_metadata?.full_name || '用户'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  
                  {/* 移动端导航菜单 */}
                  <div className="md:hidden">
                    {navigationItems.map((item) => {
                      const IconComponent = item.icon
                      return (
                        <DropdownMenuItem key={item.key} asChild>
                          <Link href={item.href} prefetch={false} className="flex items-center space-x-2">
                            <IconComponent className="w-4 h-4" />
                            <span>{item.label}</span>
                          </Link>
                        </DropdownMenuItem>
                      )
                    })}
                    <DropdownMenuSeparator />
                  </div>
                  
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>退出登录</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}