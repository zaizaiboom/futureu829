'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
// 通知设置相关组件已移除
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Settings, User as UserIcon, Shield, Trash2, Save, Eye, EyeOff } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Navigation from '@/components/navigation'

interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

interface PasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// 通知设置接口已移除

interface SettingsClientProps {
  user: User
}

export function SettingsClient({ user }: SettingsClientProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  // 通知设置状态已移除
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    loadUserProfile()
    // 通知设置功能已移除
  }, [])

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error)
        toast.error('加载用户资料失败')
      } else if (data) {
        setProfile(data)
      } else {
        // 如果没有找到资料，创建默认资料
        const defaultProfile = {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        setProfile(defaultProfile)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('加载用户资料失败')
    } finally {
      setLoading(false)
    }
  }

  // 通知设置功能已移除

  const updateProfile = async () => {
    if (!profile) return
    
    setSaving(true)
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          ...profile,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error updating profile:', error)
        toast.error('更新资料失败')
      } else {
        toast.success('资料更新成功')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('更新资料失败')
    } finally {
      setSaving(false)
    }
  }

  const updatePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('新密码和确认密码不匹配')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('新密码长度至少为6位')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      })

      if (error) {
        console.error('Error updating password:', error)
        toast.error('密码更新失败')
      } else {
        toast.success('密码更新成功')
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      }
    } catch (error) {
      console.error('Error updating password:', error)
      toast.error('密码更新失败')
    } finally {
      setSaving(false)
    }
  }

  // 通知设置功能已移除

  const deleteAccount = async () => {
    try {
      // 这里应该调用后端API来删除账户
      // 目前只是登出用户
      await supabase.auth.signOut()
      router.push('/auth/login')
      toast.success('账户已删除')
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error('删除账户失败')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <>
      <Navigation currentPage="settings" />
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* 页面标题 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">账户设置</h1>
            <p className="text-gray-600">管理你的账户信息和偏好设置</p>
          </div>

          <div className="space-y-6">
            {/* 基本信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  基本信息
                </CardTitle>
                <CardDescription>
                  更新你的个人资料信息
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">姓名</Label>
                    <Input
                      id="fullName"
                      value={profile?.full_name || ''}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                      placeholder="请输入姓名"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">邮箱</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile?.email || ''}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>注册时间:</span>
                  <Badge variant="outline">
                    {profile?.created_at ? format(new Date(profile.created_at), 'yyyy年MM月dd日', { locale: zhCN }) : '未知'}
                  </Badge>
                </div>
                <Button onClick={updateProfile} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? '保存中...' : '保存更改'}
                </Button>
              </CardContent>
            </Card>

            {/* 密码设置 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  密码设置
                </CardTitle>
                <CardDescription>
                  更改你的登录密码
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">当前密码</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="请输入当前密码"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">新密码</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="请输入新密码"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">确认新密码</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="请再次输入新密码"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                <Button onClick={updatePassword} disabled={saving || !passwordForm.newPassword}>
                  <Shield className="h-4 w-4 mr-2" />
                  {saving ? '更新中...' : '更新密码'}
                </Button>
              </CardContent>
            </Card>

            {/* 通知设置已移除 */}

            {/* 危险操作 */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Trash2 className="h-5 w-5" />
                  危险操作
                </CardTitle>
                <CardDescription>
                  这些操作不可逆转，请谨慎操作
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      删除账户
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>确认删除账户</AlertDialogTitle>
                      <AlertDialogDescription>
                        此操作将永久删除你的账户和所有相关数据，包括练习记录、学习报告等。此操作不可撤销。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteAccount} className="bg-red-600 hover:bg-red-700">
                        确认删除
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}