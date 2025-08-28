import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import LearningReportClient from './client'

export const dynamic = 'force-dynamic'

interface PracticeSession {
  id: string
  overall_score: number
  content_score: number
  logic_score: number
  expression_score: number
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

interface LearningReportData {
  user: any
  sessions: PracticeSession[]
  totalSessions: number
  averageScore: number
  improvementTrend: number
}

async function getLearningReportData(): Promise<LearningReportData | null> {
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
        averageScore: 0,
        improvementTrend: 0
      }
    }

    const sessions = sessionsData || []
    const totalSessions = sessions.length
    const averageScore = totalSessions > 0 
      ? sessions.reduce((sum, session) => sum + (session.overall_score || 0), 0) / totalSessions
      : 0

    // 计算进步趋势（最近5次与之前5次的平均分对比）
    let improvementTrend = 0
    if (totalSessions >= 10) {
      const recent5 = sessions.slice(0, 5)
      const previous5 = sessions.slice(5, 10)
      const recentAvg = recent5.reduce((sum, s) => sum + (s.overall_score || 0), 0) / 5
      const previousAvg = previous5.reduce((sum, s) => sum + (s.overall_score || 0), 0) / 5
      improvementTrend = recentAvg - previousAvg
    }

    return {
      user,
      sessions,
      totalSessions,
      averageScore,
      improvementTrend
    }
  } catch (error) {
    console.error('获取学习报告数据时发生错误:', error)
    return null
  }
}

export default async function LearningReportPage() {
  const data = await getLearningReportData()
  
  if (!data) {
    redirect('/auth/login?redirectTo=/learning-report')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">学习报告</h1>
        <p className="text-gray-600">查看您的学习进度和表现分析</p>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">加载中...</span>
        </div>
      }>
        <LearningReportClient 
          initialData={{
            sessions: data.sessions,
            totalSessions: data.totalSessions,
            averageScore: data.averageScore,
            totalHighlights: 0,
            totalDuration: 0,
            progressTrend: data.improvementTrend
          }}
        />
      </Suspense>
    </div>
  )
}