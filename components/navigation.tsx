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

interface Profile {
  id: string
  full_name?: string
  avatar_url?: string
  username?: string
}

export default function Navigation({ currentPage }: NavigationProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const router = useRouter()
  
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, username')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error('Error fetching profile:', error)
        return
      }
      
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  useEffect(() => {
    // 初始获取session
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
    };
    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`Navigation: auth state change detected. Event: ${event}`, session?.user?.email);
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
        const pendingSession = localStorage.getItem('pendingPracticeSession');
        if (pendingSession) {
          try {
            const sessionData = JSON.parse(pendingSession);
            sessionData.user_id = session.user.id;
            const response = await fetch('/api/practice-sessions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(sessionData),
            });
            if (response.ok) {
              localStorage.removeItem('pendingPracticeSession');
              console.log('Pending practice session saved successfully');
            }
          } catch (error) {
            console.error('Error saving pending session:', error);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // 单独的useEffect来处理profiles表的监听
  useEffect(() => {
    let profileSubscription: any = null
    if (user) {
      profileSubscription = supabase
        .channel(`profile-changes-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`
          },
          (payload) => {
            console.log('Profile updated:', payload.new)
            setProfile(payload.new as Profile)
          }
        )
        .subscribe()
    }

    return () => {
      if (profileSubscription) {
        profileSubscription.unsubscribe()
      }
    }
  }, [user?.id])

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
            <Link href="/">
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
                  <Link key={item.key} href={item.href}>
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
                      <AvatarImage src={profile?.avatar_url || ''} alt={user.email || ''} />
                      <AvatarFallback>
                        {profile?.full_name?.charAt(0).toUpperCase() || profile?.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">{profile?.full_name || profile?.username || '用户'}</p>
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
                          <Link href={item.href} className="flex items-center space-x-2">
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