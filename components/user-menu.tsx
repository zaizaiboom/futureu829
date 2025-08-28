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
import { LogOut, ChevronDown } from "lucide-react"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"

interface User {
  id: string
  email: string
}

interface UserMenuProps {
  user: User
  onLogout: () => void
  onToggleMobileSidebar?: () => void
}

export default function UserMenu({ user, onLogout }: UserMenuProps) {
  const userEmail = user.email
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
    if (name && name.length > 0) {
      return name.charAt(0).toUpperCase()
    }
    if (email && email.length > 0) {
      return email.charAt(0).toUpperCase()
    }
    return 'U' // 默认用户头像
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center space-x-2 h-auto px-2 py-1">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl || ''} alt={userName || userEmail} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {getInitials(userEmail, userName)}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="h-4 w-4 text-gray-500" />
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

        <DropdownMenuItem onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>退出登录</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
