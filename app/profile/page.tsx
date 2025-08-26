import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { ProfileClient } from './client'

export const dynamic = 'force-dynamic'

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

interface ProfileData {
  user: any
  profileData: UserProfile | null
  domainsData: UserDomain[]
  skillsData: UserSkill[]
}

async function getProfileData(): Promise<ProfileData | null> {
  try {
    const supabase = await createClient()
    
    // 获取用户信息
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('用户认证失败:', userError)
      return null
    }

    // 获取用户资料数据
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('获取用户资料失败:', profileError)
    }

    // 获取用户目标领域
    const { data: domainsData, error: domainsError } = await supabase
      .from('user_target_domains')
      .select('*')
      .eq('user_id', user.id)

    if (domainsError) {
      console.error('获取用户目标领域失败:', domainsError)
    }

    // 获取用户技能
    const { data: skillsData, error: skillsError } = await supabase
      .from('user_skills')
      .select('*')
      .eq('user_id', user.id)

    if (skillsError) {
      console.error('获取用户技能失败:', skillsError)
    }

    return {
      user,
      profileData: profileData || null,
      domainsData: domainsData || [],
      skillsData: skillsData || []
    }
  } catch (error) {
    console.error('获取用户资料数据时发生错误:', error)
    return null
  }
}

export default async function ProfilePage() {
  const data = await getProfileData()
  
  if (!data) {
    redirect('/auth/login?redirectTo=/profile')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">个人资料</h1>
        <p className="text-gray-600">管理您的账户信息和查看学习统计</p>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">加载中...</span>
        </div>
      }>
        <ProfileClient 
          user={data.user}
          profileData={data.profileData}
          domainsData={data.domainsData}
          skillsData={data.skillsData}
        />
      </Suspense>
    </div>
  )
}