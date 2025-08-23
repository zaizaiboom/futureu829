'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  CheckCircle
} from 'lucide-react'
import { CurrentCompetencyStatus } from '@/components/current-competency-status'
import { DevelopmentTrend } from '@/components/development-trend'
import { mockCompetencyData } from '@/types/competency'
import { format, subDays, startOfDay } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import Link from 'next/link'
import Navigation from '@/components/navigation'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts'
import { 
  QualitativeFeedback, 
  QualitativeCompetencyData, 
  CompetencyTagTrend,
  CompetencyLevel,
  generateMockQualitativeFeedback, 
  qualitativeAnalytics,
  generateQualitativeCompetencyData
} from '@/lib/qualitative-analytics'

interface PracticeSession {
  id: string
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
  // 新增定性反馈数据
  qualitative_feedback?: QualitativeFeedback
}

interface TagTrendData {
  date: string
  [tagName: string]: string | number // 动态标签名作为键，值为出现次数
}

interface WeeklyStats {
  thisWeek: {
    sessions: number
    totalHighlights: number
    totalDuration: number
  }
  lastWeek: {
    sessions: number
    totalHighlights: number
    totalDuration: number
  }
}

export function LearningReportClient({ sessions, user }: { sessions: PracticeSession[], user: User }) {
  const [competencyData, setCompetencyData] = useState<QualitativeCompetencyData[]>([])
  const [tagTrendData, setTagTrendData] = useState<TagTrendData[]>([])
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    thisWeek: { sessions: 0, totalHighlights: 0, totalDuration: 0 },
    lastWeek: { sessions: 0, totalHighlights: 0, totalDuration: 0 }
  })
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [hoveredTag, setHoveredTag] = useState<string | null>(null)
  const [growthAdvice, setGrowthAdvice] = useState<string>('')
  const [mostFrequentSuggestion, setMostFrequentSuggestion] = useState<string>('')


  useEffect(() => {
    if (sessions.length > 0) {
      processAnalyticsData()
      const mockFeedbacksForAdvice = generateMockQualitativeFeedback(sessions.length || 5);
      const advice = qualitativeAnalytics.generateGrowthAdvice(mockFeedbacksForAdvice);
      setGrowthAdvice(advice);

      const frequentSuggestion = qualitativeAnalytics.getMostFrequentSuggestion(mockFeedbacksForAdvice);
      setMostFrequentSuggestion(`根据分析，"${frequentSuggestion}"是您需要重点关注的能力领域。建议在接下来的练习中特别注意这个方面的提升。`);
    }
  }, [sessions])

  const processAnalyticsData = () => {
    if (sessions.length === 0) return

    // 生成模拟的定性反馈数据（实际应用中应从后端获取）
    const allFeedbacks = sessions.map(session => {
      const mockData = generateMockQualitativeFeedback(1)[0]
      return {
        ...mockData,
        sessionId: session.id,
        practiceDate: session.created_at.split('T')[0]
      }
    })

    // 生成能力分析数据
    const competencies = generateQualitativeCompetencyData(allFeedbacks)
    setCompetencyData(competencies)

    // 处理能力标签趋势数据
    const trends = qualitativeAnalytics.getCompetencyTagTrends(allFeedbacks)
    
    // 按日期分组并统计标签出现次数
    const trendsByDate: Record<string, Record<string, number>> = {}
    const sessionsByDate: Record<string, number> = {}
    
    // 统计每日的标签出现次数和总练习次数
    trends.forEach(trend => {
      if (!trendsByDate[trend.date]) {
        trendsByDate[trend.date] = {}
        sessionsByDate[trend.date] = 0
      }
      const key = `${trend.tagType === 'highlight' ? '✅' : '⚠️'} ${trend.tagTitle}`
      trendsByDate[trend.date][key] = (trendsByDate[trend.date][key] || 0) + 1
    })
    
    // 统计每日练习次数
    allFeedbacks.forEach(feedback => {
      const date = feedback.practiceDate
      sessionsByDate[date] = (sessionsByDate[date] || 0) + 1
    })
    
    // 转换为图表数据格式，计算百分比（基于最近5次练习的滑动窗口）
    const sortedDates = Object.keys(trendsByDate).sort()
    const chartData = sortedDates.map((date, index) => {
      const tags = trendsByDate[date]
      const percentageTags: Record<string, number> = {}
      
      // 计算每个标签在最近5次练习中的出现率
      Object.keys(tags).forEach(tagKey => {
        const recentDates = sortedDates.slice(Math.max(0, index - 4), index + 1) // 最近5次
        let totalAppearances = 0
        let totalSessions = 0
        
        recentDates.forEach(recentDate => {
          totalAppearances += trendsByDate[recentDate]?.[tagKey] || 0
          totalSessions += sessionsByDate[recentDate] || 0
        })
        
        percentageTags[tagKey] = totalSessions > 0 ? Math.round((totalAppearances / totalSessions) * 100) : 0
      })
      
      return {
        date: format(new Date(date), 'MM/dd'),
        ...percentageTags
      }
    }).slice(-30) // 最近30天
    
    setTagTrendData(chartData)

    // 计算周统计
    const now = new Date()
    const thisWeekStart = subDays(now, 7)
    const lastWeekStart = subDays(now, 14)
    
    const thisWeekSessions = sessions.filter(s => new Date(s.created_at) >= thisWeekStart)
    const lastWeekSessions = sessions.filter(s => {
      const date = new Date(s.created_at)
      return date >= lastWeekStart && date < thisWeekStart
    })
    
    const thisWeekFeedbacks = allFeedbacks.filter(f => new Date(f.practiceDate) >= thisWeekStart)
    const lastWeekFeedbacks = allFeedbacks.filter(f => {
      const date = new Date(f.practiceDate)
      return date >= lastWeekStart && date < thisWeekStart
    })
    
    const thisWeekStats = {
      sessions: thisWeekSessions.length,
      totalHighlights: qualitativeAnalytics.getTotalHighlights(thisWeekFeedbacks),
      totalDuration: thisWeekSessions.reduce((sum, s) => sum + s.practice_duration, 0)
    }
    
    const lastWeekStats = {
      sessions: lastWeekSessions.length,
      totalHighlights: qualitativeAnalytics.getTotalHighlights(lastWeekFeedbacks),
      totalDuration: lastWeekSessions.reduce((sum, s) => sum + s.practice_duration, 0)
    }
    
    setWeeklyStats({ thisWeek: thisWeekStats, lastWeek: lastWeekStats })
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
                        <p className="text-sm font-medium text-gray-600">累计获得亮点</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {weeklyStats.thisWeek.totalHighlights}
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
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

            {/* 能力光谱分析 */}
             <div className="lg:col-span-2">
               <CurrentCompetencyStatus competencyData={mockCompetencyData} />
             </div>

            {/* AI综合成长建议 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5" />
                  <span>AI综合成长建议</span>
                </CardTitle>
                <CardDescription>基于历史练习数据的个性化成长指导</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 动态生成的成长建议 */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">1</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-blue-900 mb-2">核心提升方向</h4>
                        <p className="text-sm text-blue-800 leading-relaxed mb-3">
                          {growthAdvice}
                        </p>

                      </div>
                    </div>
                  </div>
                  
                  {/* 最频繁的建议 */}
                  <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                        <span className="text-amber-600 font-semibold text-sm">2</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-amber-900 mb-2">重点关注领域</h4>
                        <p className="text-sm text-amber-800 leading-relaxed mb-3">
                          {mostFrequentSuggestion}
                        </p>

                      </div>
                    </div>
                  </div>
                  
                  {/* 积极反馈 */}
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-semibold text-sm">3</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-green-900 mb-2">保持优势</h4>
                        <p className="text-sm text-green-800 leading-relaxed mb-3">
                          您在多次练习中展现出了稳定的表现，继续保持当前的学习节奏和方法。建议定期回顾练习记录，巩固已掌握的技能。
                        </p>

                      </div>
                    </div>
                  </div>
                  

                </div>
              </CardContent>
            </Card>

            {/* 能力发展趋势 */}
             <div className="lg:col-span-3">
               <DevelopmentTrend competencyData={mockCompetencyData} />
             </div>
          </div>
        )}
      </div>
    </div>
  )
}