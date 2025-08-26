'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, Clock, Target, Star, Brain, BarChart3, Home, User, FileText, Settings, CheckCircle, Calendar, Lightbulb } from 'lucide-react'
import { CompetencyAssessment } from '@/components/competency-assessment'
import { HighlightsImprovements } from '@/components/highlights-improvements'
import { TaskList } from '@/components/task-list'
import Navigation from '@/components/navigation'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import '@/styles/learning-report.css'

interface PracticeSession {
  id: string
  created_at: string
  overall_score: number
  content_score: number
  logic_score: number
  expression_score: number
  practice_duration: number
  interview_questions: {
    question_text: string
  }
  interview_stages: {
    stage_name: string
  }
  question_categories: {
    category_name: string
  }
  // 兼容旧格式
  score?: number
  highlights?: string[]
  areas_for_improvement?: string[]
  duration?: number
  competency_tags?: string[]
}

interface TagTrendData {
  date: string
  [key: string]: number | string
}

interface LearningReportData {
  sessions: PracticeSession[]
  totalSessions: number
  averageScore: number
  totalHighlights: number
  totalDuration: number
  progressTrend: number
}

interface LearningReportClientProps {
  initialData: LearningReportData
}

export default function LearningReportClient({ initialData }: LearningReportClientProps) {
  const [data, setData] = useState(initialData)
  const [tagTrendData, setTagTrendData] = useState<TagTrendData[]>([])


  useEffect(() => {
    // 处理能力标签趋势数据
    const processTagTrendData = () => {
      if (!data.sessions || data.sessions.length === 0) return
      
      // 按日期分组会话
      const sessionsByDate = data.sessions.reduce((acc, session) => {
        const date = new Date(session.created_at).toISOString().split('T')[0]
        if (!acc[date]) {
          acc[date] = []
        }
        acc[date].push(session)
        return acc
      }, {} as Record<string, PracticeSession[]>)

      // 统计每个日期的标签出现次数
      const tagTrends = Object.entries(sessionsByDate).map(([date, sessions]) => {
        const tagCounts: Record<string, number> = {}
        
        sessions.forEach(session => {
          // 从问题分类和面试阶段生成标签
          const tags = [
            session.question_categories?.category_name,
            session.interview_stages?.stage_name
          ].filter(Boolean)
          
          // 兼容旧格式
          const competencyTags = session.competency_tags || tags
          
          competencyTags.forEach(tag => {
            if (tag) {
              tagCounts[tag] = (tagCounts[tag] || 0) + 1
            }
          })
        })

        // 计算百分比
        const totalTags = Object.values(tagCounts).reduce((sum, count) => sum + count, 0)
        const tagPercentages: Record<string, number> = {}
        Object.entries(tagCounts).forEach(([tag, count]) => {
          tagPercentages[tag] = totalTags > 0 ? Math.round((count / totalTags) * 100) : 0
        })

        return {
          date: new Date(date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
          ...tagPercentages
        }
      })

      // 按日期排序
      tagTrends.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      
      setTagTrendData(tagTrends)
    }

    processTagTrendData()
  }, [data])

  // 计算本周和上周的统计数据
  const calculateWeeklyStats = () => {
    if (!data.sessions || data.sessions.length === 0) {
      return {
        thisWeek: { sessions: 0, totalHighlights: 0, totalDuration: 0 },
        lastWeek: { sessions: 0, totalHighlights: 0, totalDuration: 0 }
      }
    }

    const now = new Date()
    const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
    const startOfLastWeek = new Date(startOfThisWeek.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const thisWeekSessions = data.sessions.filter(session => {
      const sessionDate = new Date(session.created_at)
      return sessionDate >= startOfThisWeek
    })
    
    const lastWeekSessions = data.sessions.filter(session => {
      const sessionDate = new Date(session.created_at)
      return sessionDate >= startOfLastWeek && sessionDate < startOfThisWeek
    })
    
    const calculateStats = (sessions: PracticeSession[]) => {
      const totalHighlights = sessions.reduce((sum, session) => {
        // 兼容新旧格式
        return sum + (session.highlights?.length || 0)
      }, 0)
      
      const totalDuration = sessions.reduce((sum, session) => {
        // 兼容新旧格式
        return sum + (session.duration || session.practice_duration || 0)
      }, 0)
      
      return {
        sessions: sessions.length,
        totalHighlights,
        totalDuration
      }
    }
    
    return {
      thisWeek: calculateStats(thisWeekSessions),
      lastWeek: calculateStats(lastWeekSessions)
    }
  }

  const weeklyStats = calculateWeeklyStats()
  const thisWeekStats = weeklyStats.thisWeek
  const lastWeekStats = weeklyStats.lastWeek

  // 格式化时长显示
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`
    }
    return `${minutes}分钟`
  }

  // 获取分数变化图标
  const getScoreChangeIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />
    } else if (change < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />
    } else {
      return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getScoreChangeColor = (current: number, previous: number) => {
    if (current > previous) return 'text-green-600'
    if (current < previous) return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <>
      <Navigation currentPage="learning-report" />
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* 页面标题 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">学习报告</h1>
            <p className="text-gray-600">深入了解您的学习进展和能力发展</p>
          </div>

          {data.sessions.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无练习数据</h3>
              <p className="text-gray-600 mb-6">完成一些练习后，这里将显示您的详细学习报告</p>
              <Link href="/interview-practice" prefetch={false}>
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
                <Card className="learning-report-card stat-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">总练习次数</p>
                        <p className="text-2xl font-bold text-gray-900">{data.sessions.length}</p>
                      </div>
                      <Target className="h-8 w-8 text-purple-600 stat-icon" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="learning-report-card stat-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">累计获得亮点</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {weeklyStats.thisWeek.totalHighlights}
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600 stat-icon" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="learning-report-card stat-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">本周练习</p>
                        <div className="flex items-center space-x-2">
                          <p className="text-2xl font-bold text-gray-900">{weeklyStats.thisWeek.sessions}</p>
                          {getScoreChangeIcon(weeklyStats.thisWeek.sessions, weeklyStats.lastWeek.sessions)}
                        </div>
                      </div>
                      <Calendar className="h-8 w-8 text-blue-600 stat-icon" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="learning-report-card stat-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">总练习时长</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatDuration(data.sessions.reduce((sum, s) => sum + (s.practice_duration || 0), 0))}
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-green-600 stat-icon" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 能力光谱分析 */}
             <div className="lg:col-span-2">
               <div className="learning-report-card">
                 <CompetencyAssessment />
               </div>
             </div>

            {/* AI综合成长建议 */}
            <Card className="learning-report-card">
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
                          基于您的练习数据分析，建议重点提升逻辑思维能力和表达技巧。可以通过多练习结构化思考和案例分析来改善。
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
                          在沟通表达方面需要加强练习，建议多关注语言的逻辑性和条理性，提升整体表达效果。
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

            {/* 任务清单 */}
            <div className="lg:col-span-3">
              <Card className="learning-report-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-xl font-bold">📝 任务清单</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 任务卡片1 */}
                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg">任务1（2025年8月20日面试）</h3>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        进行中
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-bold text-blue-600 mb-2">【知识补充】</h4>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          <li>重新学习"MVP"和"A/B测试"的相关知识</li>
                          <li>深入理解产品生命周期管理</li>
                          <li>掌握用户体验设计原则</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-bold text-green-600 mb-2">【实战练习】</h4>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          <li>完成3个产品分析案例</li>
                          <li>练习结构化思维表达</li>
                          <li>模拟面试场景训练</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-bold text-purple-600 mb-2">【思维习惯】</h4>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          <li>培养用户思维和数据驱动决策</li>
                          <li>提升逻辑分析和批判性思维</li>
                          <li>加强沟通表达的条理性</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* 任务卡片2 */}
                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg">任务2（2025年9月5日面试）</h3>
                      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                        待开始
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-bold text-blue-600 mb-2">【知识补充】</h4>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          <li>学习敏捷开发和Scrum框架</li>
                          <li>了解竞品分析方法论</li>
                          <li>掌握商业模式画布</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-bold text-green-600 mb-2">【实战练习】</h4>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          <li>完成竞品分析报告</li>
                          <li>设计产品改进方案</li>
                          <li>练习团队协作场景</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-bold text-purple-600 mb-2">【思维习惯】</h4>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          <li>建立全局视野和战略思维</li>
                          <li>培养创新思维和解决问题能力</li>
                          <li>提升团队合作和领导力</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* 任务卡片3 */}
                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg">任务3（2025年7月15日面试）</h3>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        已完成
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-bold text-blue-600 mb-2">【知识补充】</h4>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          <li>✅ 学习产品需求分析方法</li>
                          <li>✅ 掌握用户调研技巧</li>
                          <li>✅ 了解产品设计流程</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-bold text-green-600 mb-2">【实战练习】</h4>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          <li>✅ 完成用户画像分析</li>
                          <li>✅ 设计产品原型</li>
                          <li>✅ 进行用户测试</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-bold text-purple-600 mb-2">【思维习惯】</h4>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          <li>✅ 建立用户中心的思维模式</li>
                          <li>✅ 培养数据分析能力</li>
                          <li>✅ 提升逻辑思维和表达能力</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  )
}