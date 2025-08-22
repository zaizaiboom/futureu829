'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar, Filter, TrendingUp, TrendingDown, Clock, Eye, BarChart3, History } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import Link from 'next/link'
import Navigation from '@/components/navigation'

interface PracticeSession {
  id: string
  question_id: number
  stage_id: number
  category_id: number
  user_answer: string
  overall_score: number
  content_score: number
  logic_score: number
  expression_score: number
  ai_feedback: string
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

interface FilterOptions {
  stage: string
  category: string
  dateRange: string
  sortBy: string
}

interface PracticeHistoryClientProps {
  user: User
  sessions: PracticeSession[]
  stages: any[]
  categories: any[]
}

const SORT_OPTIONS = [
  { value: 'created_at_desc', label: '最新练习' },
  { value: 'created_at_asc', label: '最早练习' },
  { value: 'overall_score_desc', label: '分数从高到低' },
  { value: 'overall_score_asc', label: '分数从低到高' }
]

const DATE_RANGE_OPTIONS = [
  { value: 'all', label: '全部时间' },
  { value: '7days', label: '最近7天' },
  { value: '30days', label: '最近30天' },
  { value: '90days', label: '最近90天' }
]

export function PracticeHistoryClient({ user, sessions, stages, categories }: PracticeHistoryClientProps) {
  const [filteredSessions, setFilteredSessions] = useState<PracticeSession[]>(sessions)
  const [filters, setFilters] = useState<FilterOptions>({
    stage: 'all',
    category: 'all',
    dateRange: 'all',
    sortBy: 'created_at_desc'
  })

  useEffect(() => {
    applyFilters()
  }, [sessions, filters])

  const applyFilters = () => {
    let filtered = [...sessions]

    // 按阶段筛选
    if (filters.stage !== 'all') {
      filtered = filtered.filter(session => session.stage_id.toString() === filters.stage)
    }

    // 按类别筛选
    if (filters.category !== 'all') {
      filtered = filtered.filter(session => session.category_id.toString() === filters.category)
    }

    // 按日期范围筛选
    if (filters.dateRange !== 'all') {
      const now = new Date()
      const days = parseInt(filters.dateRange.replace('days', ''))
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(session => new Date(session.created_at) >= cutoffDate)
    }

    // 排序
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'created_at_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'created_at_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'overall_score_desc':
          return b.overall_score - a.overall_score
        case 'overall_score_asc':
          return a.overall_score - b.overall_score
        default:
          return 0
      }
    })

    setFilteredSessions(filtered)
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100'
    if (score >= 80) return 'bg-blue-100'
    if (score >= 70) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}分${remainingSeconds}秒`
  }

  const getStageColor = (stageId: number) => {
    const colors = [
      'bg-purple-100 text-purple-800',
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-orange-100 text-orange-800'
    ]
    return colors[(stageId - 1) % colors.length] || 'bg-gray-100 text-gray-800'
  }

  const calculateStats = () => {
    const totalSessions = filteredSessions.length
    const averageScore = totalSessions > 0 
      ? Math.round(filteredSessions.reduce((sum, session) => sum + session.overall_score, 0) / totalSessions)
      : 0
    
    return { totalSessions, averageScore }
  }

  const { totalSessions, averageScore } = calculateStats()

  return (
    <>
      <Navigation currentPage="practice-history" />
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* 页面标题 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">练习记录</h1>
            <p className="text-gray-600">回顾你的面试练习历程，追踪进步轨迹</p>
          </div>

          {/* 筛选和排序工具栏 */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">筛选条件:</span>
                </div>
                
                {/* 面试阶段筛选 */}
                <Select value={filters.stage} onValueChange={(value) => setFilters(prev => ({ ...prev, stage: value }))}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="选择阶段" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部阶段</SelectItem>
                    {stages.filter(stage => stage.id != null).map(stage => (
                      <SelectItem key={stage.id} value={stage.id.toString()}>
                        {stage.stage_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* 问题类别筛选 */}
                <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="选择类别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类别</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.category_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* 日期范围筛选 */}
                <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="时间范围" />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_RANGE_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* 排序方式 */}
                <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="排序方式" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">总练习次数</p>
                    <p className="text-3xl font-bold">{sessions.length}</p>
                  </div>
                  <History className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">平均分数</p>
                    <p className="text-3xl font-bold">
                      {sessions.length > 0 
                        ? Math.round(sessions.reduce((sum, session) => sum + session.overall_score, 0) / sessions.length)
                        : 0
                      }
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">筛选结果</p>
                    <p className="text-3xl font-bold">{totalSessions}</p>
                  </div>
                  <Filter className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 练习记录列表 */}
          {filteredSessions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <Calendar className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无练习记录</h3>
                <p className="text-gray-600 mb-6">开始你的第一次面试练习吧！</p>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" asChild>
                  <Link href="/interview-practice">
                    开始练习
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredSessions.map((session) => (
                <Card key={session.id} className="hover:shadow-lg transition-all duration-300 group border-l-4 border-l-purple-500">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* 练习信息头部 */}
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span className="font-medium">
                              {format(new Date(session.created_at), 'yyyy年MM月dd日', { locale: zhCN })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>{formatDuration(session.practice_duration)}</span>
                          </div>
                          <Badge className={getStageColor(session.stage_id)}>
                            {session.interview_stages?.stage_name ?? '未知阶段'}
                          </Badge>
                          <Badge variant="outline">
                            {session.question_categories?.category_name ?? '未知类别'}
                          </Badge>
                        </div>

                        {/* 问题内容 */}
                        <div className="mb-4">
                          <p className="text-gray-900 font-medium mb-2">练习问题:</p>
                          <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border-l-4 border-l-purple-300">
                            {session.interview_questions?.question_text ?? '未知问题'}
                          </p>
                        </div>

                        {/* 分数展示 */}
                        <div className="flex items-center gap-4 mb-4">
                          <div className={`${getScoreBgColor(session.overall_score)} rounded-lg p-3 flex-1`}>
                            <div className="text-xs text-gray-600 mb-1">综合得分</div>
                            <div className={`text-2xl font-bold ${getScoreColor(session.overall_score)}`}>
                              {session.overall_score}
                            </div>
                            <Progress value={session.overall_score} className="mt-2" />
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2">
                            <div className="text-xs text-gray-600">内容</div>
                            <div className="font-semibold text-sm">{session.content_score}</div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2">
                            <div className="text-xs text-gray-600">逻辑</div>
                            <div className="font-semibold text-sm">{session.logic_score}</div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2">
                            <div className="text-xs text-gray-600">表达</div>
                            <div className="font-semibold text-sm">{session.expression_score}</div>
                          </div>
                        </div>

                        {/* 查看详情按钮 */}
                        <Button 
                          variant="outline" 
                          className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 group-hover:text-white group-hover:border-transparent transition-all duration-300"
                          asChild
                        >
                          <Link href={`/practice-history/${session.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            查看详情
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}