'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Brain, 
  Target, 
  Clock, 
  Award,
  Lightbulb,
  ChevronRight,
  Calendar,
  Star
} from 'lucide-react'
import { format, subDays, startOfDay } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import Link from 'next/link'
import Navigation from '@/components/navigation'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts'

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

interface CompetencyData {
  subject: string
  score: number
  fullMark: 100
}

interface ProgressData {
  date: string
  score: number
  sessions: number
}

interface WeeklyStats {
  thisWeek: {
    sessions: number
    avgScore: number
    totalDuration: number
  }
  lastWeek: {
    sessions: number
    avgScore: number
    totalDuration: number
  }
}

export function LearningReportClient({ sessions, user }: { sessions: PracticeSession[], user: User }) {
  const [competencyData, setCompetencyData] = useState<CompetencyData[]>([])
  const [progressData, setProgressData] = useState<ProgressData[]>([])
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    thisWeek: { sessions: 0, avgScore: 0, totalDuration: 0 },
    lastWeek: { sessions: 0, avgScore: 0, totalDuration: 0 }
  })
  const [aiInsights, setAiInsights] = useState<string>('')

  useEffect(() => {
    if (sessions.length > 0) {
      processAnalyticsData()
      generateAIInsights()
    }
  }, [sessions])

  const processAnalyticsData = () => {
    // 处理能力雷达图数据
    const avgContent = sessions.reduce((sum, s) => sum + s.content_score, 0) / sessions.length
    const avgLogic = sessions.reduce((sum, s) => sum + s.logic_score, 0) / sessions.length
    const avgExpression = sessions.reduce((sum, s) => sum + s.expression_score, 0) / sessions.length
    const avgOverall = sessions.reduce((sum, s) => sum + s.overall_score, 0) / sessions.length

    setCompetencyData([
      { subject: '内容质量', score: Math.round(avgContent), fullMark: 100 },
      { subject: '逻辑思维', score: Math.round(avgLogic), fullMark: 100 },
      { subject: '表达能力', score: Math.round(avgExpression), fullMark: 100 },
      { subject: '综合表现', score: Math.round(avgOverall), fullMark: 100 }
    ])

    // 处理进步曲线数据
    const last30Days = sessions
      .filter(s => new Date(s.created_at) >= subDays(new Date(), 30))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    const dailyData = last30Days.reduce((acc, session) => {
      const date = format(new Date(session.created_at), 'MM-dd')
      if (!acc[date]) {
        acc[date] = { sessions: 0, totalScore: 0 }
      }
      acc[date].sessions += 1
      acc[date].totalScore += session.overall_score
      return acc
    }, {} as Record<string, { sessions: number, totalScore: number }>)

    const progressArray = Object.entries(dailyData).map(([date, data]) => ({
      date,
      score: Math.round(data.totalScore / data.sessions),
      sessions: data.sessions
    }))

    setProgressData(progressArray)

    // 处理周统计数据
    const now = new Date()
    const thisWeekStart = startOfDay(subDays(now, 7))
    const lastWeekStart = startOfDay(subDays(now, 14))

    const thisWeekSessions = sessions.filter(s => new Date(s.created_at) >= thisWeekStart)
    const lastWeekSessions = sessions.filter(s => 
      new Date(s.created_at) >= lastWeekStart && new Date(s.created_at) < thisWeekStart
    )

    setWeeklyStats({
      thisWeek: {
        sessions: thisWeekSessions.length,
        avgScore: thisWeekSessions.length > 0 
          ? Math.round(thisWeekSessions.reduce((sum, s) => sum + s.overall_score, 0) / thisWeekSessions.length)
          : 0,
        totalDuration: thisWeekSessions.reduce((sum, s) => sum + s.practice_duration, 0)
      },
      lastWeek: {
        sessions: lastWeekSessions.length,
        avgScore: lastWeekSessions.length > 0
          ? Math.round(lastWeekSessions.reduce((sum, s) => sum + s.overall_score, 0) / lastWeekSessions.length)
          : 0,
        totalDuration: lastWeekSessions.reduce((sum, s) => sum + s.practice_duration, 0)
      }
    })
  }

  const generateAIInsights = () => {
    if (sessions.length === 0) {
      setAiInsights('开始练习后，AI将为您提供个性化的学习建议。')
      return
    }

    const avgScore = sessions.reduce((sum, s) => sum + s.overall_score, 0) / sessions.length
    const recentSessions = sessions.slice(0, 5)
    const recentAvg = recentSessions.reduce((sum, s) => sum + s.overall_score, 0) / recentSessions.length

    let insights = ''
    if (recentAvg > avgScore + 5) {
      insights = '🎉 您最近的表现有显著提升！继续保持这种学习节奏。'
    } else if (recentAvg < avgScore - 5) {
      insights = '💪 建议加强练习，特别关注逻辑思维和表达能力的提升。'
    } else {
      insights = '📈 您的表现保持稳定，可以尝试挑战更高难度的题目。'
    }

    setAiInsights(insights)
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`
    }
    return `${minutes}分钟`
  }

  const getScoreChangeIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <div className="h-4 w-4" />
  }

  const getScoreChangeColor = (current: number, previous: number) => {
    if (current > previous) return 'text-green-600'
    if (current < previous) return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-purple-50">
      <Navigation currentPage="learning-report" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">学习报告</h1>
          <p className="text-gray-600">深入了解您的学习进展和能力发展</p>
        </div>

        {sessions.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无练习数据</h3>
              <p className="text-gray-600 mb-6">完成一些练习后，这里将显示您的详细学习报告</p>
              <Link href="/interview-practice">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  开始练习
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 数据概览 */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">总练习次数</p>
                        <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
                      </div>
                      <Target className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">平均分数</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {Math.round(sessions.reduce((sum, s) => sum + s.overall_score, 0) / sessions.length)}
                        </p>
                      </div>
                      <Star className="h-8 w-8 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">本周练习</p>
                        <div className="flex items-center space-x-2">
                          <p className="text-2xl font-bold text-gray-900">{weeklyStats.thisWeek.sessions}</p>
                          {getScoreChangeIcon(weeklyStats.thisWeek.sessions, weeklyStats.lastWeek.sessions)}
                        </div>
                      </div>
                      <Calendar className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">总练习时长</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatDuration(sessions.reduce((sum, s) => sum + s.practice_duration, 0))}
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 能力雷达图 */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5" />
                  <span>能力分析</span>
                </CardTitle>
                <CardDescription>各项能力的综合评估</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={competencyData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar
                        name="能力分数"
                        dataKey="score"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* AI智能建议 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5" />
                  <span>AI建议</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">{aiInsights}</p>
                </div>
                <div className="mt-4 space-y-2">
                  <Link href="/interview-practice" className="group">
                    <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100 hover:border-purple-200 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-purple-900">继续练习</h5>
                          <p className="text-sm text-purple-600">提升面试技能</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* 进步曲线 */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>进步曲线</span>
                </CardTitle>
                <CardDescription>最近30天的表现趋势</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'score' ? `${value}分` : `${value}次`,
                          name === 'score' ? '平均分数' : '练习次数'
                        ]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#8b5cf6" 
                        strokeWidth={3}
                        dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}