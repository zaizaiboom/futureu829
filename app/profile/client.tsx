'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera, Plus, X, ExternalLink, Save, User as UserIcon } from 'lucide-react'
import { toast } from 'sonner'
import Navigation from '@/components/navigation'

interface UserProfile {
  id: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  membership_status: string
  current_stage: string | null
  years_of_experience: string | null
  linkedin_url: string | null
  portfolio_url: string | null
  resume_url: string | null
}

interface UserDomain {
  id: number
  domain_name: string
}

interface UserSkill {
  id: number
  skill_name: string
}

const STAGE_OPTIONS = [
  '在校学生',
  '寻求第一份PM工作',
  '在职PM寻求提升',
  '跨行转型中'
]

const EXPERIENCE_OPTIONS = [
  '0-1年',
  '1-3年',
  '3-5年',
  '5年以上'
]

const DOMAIN_OPTIONS = [
  'SaaS', 'AIGC', '大语言模型', '金融科技', '自动驾驶',
  '智能硬件', '教育科技', '医疗AI', '电商推荐', '内容平台'
]

const SKILL_OPTIONS = [
  '用户研究', '数据分析', 'PRD撰写', '项目管理', '市场分析',
  '竞品分析', 'A/B测试', '用户体验设计', '商业建模', '技术理解',
  '团队协作', '沟通表达'
]

interface ProfileClientProps {
  user: User
  profileData: UserProfile | null
  domainsData: UserDomain[]
  skillsData: UserSkill[]
}

export function ProfileClient({ user, profileData, domainsData, skillsData }: ProfileClientProps) {
  const [profile, setProfile] = useState<UserProfile | null>(profileData)
  const [domains, setDomains] = useState<UserDomain[]>(domainsData || [])
  const [skills, setSkills] = useState<UserSkill[]>(skillsData || [])
  const [saving, setSaving] = useState(false)
  const [newDomain, setNewDomain] = useState('')
  const [newSkill, setNewSkill] = useState('')
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    // 如果没有profile数据，创建默认profile
    if (!profile && user) {
      const defaultProfile: UserProfile = {
        id: user.id,
        full_name: user.user_metadata?.full_name || null,
        username: user.user_metadata?.username || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        membership_status: 'free',
        current_stage: null,
        years_of_experience: null,
        linkedin_url: null,
        portfolio_url: null,
        resume_url: null
      }
      setProfile(defaultProfile)
    }
  }, [profile, user])

  const saveProfile = async () => {
    if (!profile || !user) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: profile.full_name,
          username: profile.username,
          current_stage: profile.current_stage,
          years_of_experience: profile.years_of_experience,
          linkedin_url: profile.linkedin_url,
          portfolio_url: profile.portfolio_url,
          resume_url: profile.resume_url,
          membership_status: profile.membership_status
        })

      if (error) throw error
      toast.success('资料保存成功！')
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const addDomain = async () => {
    if (!newDomain || !user) return

    try {
      const { data, error } = await supabase
        .from('user_domains')
        .insert({ user_id: user.id, domain_name: newDomain })
        .select()
        .single()

      if (error) throw error
      if (data) {
        setDomains([...domains, data])
        setNewDomain('')
        toast.success('领域添加成功！')
      }
    } catch (error) {
      console.error('Error adding domain:', error)
      toast.error('添加失败，请重试')
    }
  }

  const removeDomain = async (domainId: number) => {
    try {
      const { error } = await supabase
        .from('user_domains')
        .delete()
        .eq('id', domainId)

      if (error) throw error
      setDomains(domains.filter(d => d.id !== domainId))
      toast.success('领域移除成功！')
    } catch (error) {
      console.error('Error removing domain:', error)
      toast.error('移除失败，请重试')
    }
  }

  const addSkill = async () => {
    if (!newSkill || !user) return

    try {
      const { data, error } = await supabase
        .from('user_skills')
        .insert({ user_id: user.id, skill_name: newSkill })
        .select()
        .single()

      if (error) throw error
      if (data) {
        setSkills([...skills, data])
        setNewSkill('')
        toast.success('技能添加成功！')
      }
    } catch (error) {
      console.error('Error adding skill:', error)
      toast.error('添加失败，请重试')
    }
  }

  const removeSkill = async (skillId: number) => {
    try {
      const { error } = await supabase
        .from('user_skills')
        .delete()
        .eq('id', skillId)

      if (error) throw error
      setSkills(skills.filter(s => s.id !== skillId))
      toast.success('技能移除成功！')
    } catch (error) {
      console.error('Error removing skill:', error)
      toast.error('移除失败，请重试')
    }
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <UserIcon className="h-16 w-16 text-purple-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">无法加载用户资料</h2>
          <p className="text-gray-600">请刷新页面重试</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-purple-50">
      <Navigation currentPage="profile" />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            个人资料
          </h1>
          <p className="text-gray-600 mt-2">完善您的资料，获得更个性化的面试训练体验</p>
        </div>

        <div className="space-y-6">
          {/* 用户基本信息卡片 */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-purple-600" />
                基本信息
              </CardTitle>
              <CardDescription>
                设置您的基本个人信息和头像
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 头像部分 */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile.avatar_url || ''} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-400 text-white text-xl">
                      {profile.full_name?.charAt(0) || profile.username?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 bg-white shadow-md"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1">
                  <Badge 
                    variant={profile.membership_status === 'pro' ? 'default' : 'secondary'}
                    className={profile.membership_status === 'pro' 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600' 
                      : 'bg-gray-100 text-gray-600'
                    }
                  >
                    {profile.membership_status === 'pro' ? 'Pro会员' : '免费版用户'}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-2">
                    注册邮箱: {user?.email}
                  </p>
                </div>
              </div>

              {/* 基本信息表单 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">姓名</Label>
                  <Input
                    id="fullName"
                    value={profile.full_name || ''}
                    onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                    placeholder="请输入您的姓名"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">昵称</Label>
                  <Input
                    id="username"
                    value={profile.username || ''}
                    onChange={(e) => setProfile({...profile, username: e.target.value})}
                    placeholder="请输入您的昵称"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 专业背景模块 */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-5 w-5 bg-gradient-to-br from-purple-600 to-blue-600 rounded" />
                专业背景
              </CardTitle>
              <CardDescription>
                告诉我们您的职业背景，我们将为您推荐合适的面试题目
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>当前阶段</Label>
                  <Select
                    value={profile.current_stage || ''}
                    onValueChange={(value) => setProfile({...profile, current_stage: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="请选择您的当前阶段" />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGE_OPTIONS.map((stage) => (
                        <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>工作经验</Label>
                  <Select
                    value={profile.years_of_experience || ''}
                    onValueChange={(value) => setProfile({...profile, years_of_experience: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="请选择您的工作经验" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPERIENCE_OPTIONS.map((exp) => (
                        <SelectItem key={exp} value={exp}>{exp}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 目标领域 */}
              <div className="space-y-3">
                <Label>目标领域</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {domains.map((domain) => (
                    <Badge
                      key={domain.id}
                      variant="outline"
                      className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                    >
                      {domain.domain_name}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-2 hover:bg-red-100"
                        onClick={() => removeDomain(domain.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Select value={newDomain} onValueChange={setNewDomain}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="选择感兴趣的AI领域" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOMAIN_OPTIONS.filter(domain => 
                        !domains.some(d => d.domain_name === domain)
                      ).map((domain) => (
                        <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={addDomain}
                    disabled={!newDomain}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* 核心能力标签 */}
              <div className="space-y-3">
                <Label>核心能力标签</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {skills.map((skill) => (
                    <Badge
                      key={skill.id}
                      variant="outline"
                      className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                    >
                      {skill.skill_name}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-2 hover:bg-red-100"
                        onClick={() => removeSkill(skill.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Select value={newSkill} onValueChange={setNewSkill}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="选择您的PM技能" />
                    </SelectTrigger>
                    <SelectContent>
                      {SKILL_OPTIONS.filter(skill => 
                        !skills.some(s => s.skill_name === skill)
                      ).map((skill) => (
                        <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={addSkill}
                    disabled={!newSkill}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 外部链接 */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-purple-600" />
                外部链接
              </CardTitle>
              <CardDescription>
                添加您的专业档案链接，展示您的专业背景
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn个人资料</Label>
                <Input
                  id="linkedin"
                  type="url"
                  value={profile.linkedin_url || ''}
                  onChange={(e) => setProfile({...profile, linkedin_url: e.target.value})}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="portfolio">个人作品集网站</Label>
                <Input
                  id="portfolio"
                  type="url"
                  value={profile.portfolio_url || ''}
                  onChange={(e) => setProfile({...profile, portfolio_url: e.target.value})}
                  placeholder="https://yourportfolio.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resume">在线简历</Label>
                <Input
                  id="resume"
                  type="url"
                  value={profile.resume_url || ''}
                  onChange={(e) => setProfile({...profile, resume_url: e.target.value})}
                  placeholder="https://yourresume.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* 保存按钮 */}
          <div className="flex justify-end">
            <Button
              onClick={saveProfile}
              disabled={saving}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-8"
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  保存中...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  保存资料
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}