import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { PracticeHistoryClient } from './client'

export const dynamic = 'force-dynamic'

interface PracticeSession {
  id: string
  overall_score: number
  content_score: number
  logic_score: number
  expression_score: number
  practice_duration: number
  created_at: string
  interview_questions: {
    question_text: string
  }
  interview_stages: {
    stage_name: string
  }
  question_categories: {
    category_name: string
  }
}

interface PracticeHistoryData {
  user: any
  sessions: PracticeSession[]
  totalSessions: number
  categories: string[]
  stages: string[]
}

async function getPracticeHistoryData(): Promise<PracticeHistoryData | null> {
  try {
    const supabase = await createClient()
    
    // 获取用户信息
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('用户认证失败:', userError)
      return null
    }

    // 获取练习会话数据
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('practice_sessions')
      .select(`
        *,
        interview_questions(question_text),
        interview_stages(stage_name),
        question_categories(category_name)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (sessionsError) {
      console.error('获取练习数据失败:', sessionsError)
      return {
        user,
        sessions: [],
        totalSessions: 0,
        categories: [],
        stages: []
      }
    }

    const sessions = sessionsData || []
    
    // 提取唯一的分类和阶段
    const categories = [...new Set(
      sessions
        .map(s => s.question_categories?.category_name)
        .filter(Boolean)
    )]
    
    const stages = [...new Set(
      sessions
        .map(s => s.interview_stages?.stage_name)
        .filter(Boolean)
    )]

    return {
      user,
      sessions,
      totalSessions: sessions.length,
      categories,
      stages
    }
  } catch (error) {
    console.error('获取练习记录数据时发生错误:', error)
    return null
  }
}

export default async function PracticeHistoryPage() {
  const data = await getPracticeHistoryData()
  
  if (!data) {
    redirect('/auth/login?redirectTo=/practice-history')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">练习记录</h1>
        <p className="text-gray-600">查看您的所有练习历史和详细表现</p>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">加载中...</span>
        </div>
      }>
        <PracticeHistoryClient 
          user={data.user}
          sessions={data.sessions}
          totalSessions={data.totalSessions}
          categories={data.categories}
          stages={data.stages}
        />
      </Suspense>
    </div>
  )
}