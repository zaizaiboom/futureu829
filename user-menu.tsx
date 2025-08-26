"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Settings, LogOut, BarChart3, BookOpen } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"

interface UserMenuProps {
  userEmail: string
  onLogout: () => void
}

export default function UserMenu({ userEmail, onLogout }: UserMenuProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('avatar_url, full_name, username')
            .eq('id', user.id)
            .single()
          
          if (profile) {
            setAvatarUrl(profile.avatar_url)
            setUserName(profile.full_name || profile.username)
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      }
    }

    fetchUserProfile()
  }, [])

  const getInitials = (email: string, name?: string | null) => {
    if (name) {
      return name.charAt(0).toUpperCase()
    }
    return email.charAt(0).toUpperCase()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl || ''} alt={userName || userEmail} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {getInitials(userEmail, userName)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            <p className="font-medium text-sm">{userName || userEmail}</p>
            <p className="text-xs text-muted-foreground">{userName ? userEmail : 'FutureU 用户'}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            <span>个人资料</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/learning-report" className="flex items-center">
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>学习报告</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/practice-history" className="flex items-center">
            <BookOpen className="mr-2 h-4 w-4" />
            <span>练习记录</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>设置</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>退出登录</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
