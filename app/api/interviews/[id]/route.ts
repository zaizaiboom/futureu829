import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // 获取当前用户
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      // 如果用户未登录，返回404
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    // 查询特定面试记录
    const { data: interview, error } = await supabase
      .from('interview_sessions')
      .select(`
        id,
        created_at,
        completed_at,
        total_score,
        status,
        interview_answers (
          id,
          question_text,
          user_answer,
          ai_feedback,
          score,
          created_at
        )
      `)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
      }
      console.error('Error fetching interview:', error)
      return NextResponse.json({ error: 'Failed to fetch interview' }, { status: 500 })
    }

    // 格式化数据
    const formattedInterview = {
      id: interview.id,
      date: interview.created_at,
      completedAt: interview.completed_at,
      totalScore: interview.total_score,
      status: interview.status,
      questionCount: interview.interview_answers?.length || 0,
      questions: interview.interview_answers?.map(answer => ({
        id: answer.id,
        question: answer.question_text,
        answer: answer.user_answer,
        feedback: answer.ai_feedback,
        score: answer.score,
        createdAt: answer.created_at
      })) || []
    }

    return NextResponse.json({ interview: formattedInterview })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}