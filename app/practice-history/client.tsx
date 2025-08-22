'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Calendar, Filter, Clock, Eye, Target, CheckCircle, AlertTriangle, Lightbulb, History } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import Link from 'next/link'
import Navigation from '@/components/navigation'
import { QualitativeFeedback, generateMockQualitativeFeedback, qualitativeAnalytics } from '@/lib/qualitative-analytics'

interface PracticeSession {
  id: string
  question_id: number
  stage_id: number
  category_id: number
  user_answer: string
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
  // 新增定性反馈数据
  qualitative_feedback?: QualitativeFeedback
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
  { value: 'created_at_asc', label: '最早练习' }
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
        default:
          return 0
      }
    })

    setFilteredSessions(filtered)
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

  // 生成模拟的定性反馈数据（实际应用中应从后端获取）
  const getQualitativeFeedback = (sessionId: string): QualitativeFeedback => {
    const mockData = generateMockQualitativeFeedback(1)[0]
    return {
      ...mockData,
      sessionId
    }
  }

  // 获取核心提升点
  const getCoreImprovementArea = () => {
    const allFeedbacks = sessions.map(session => getQualitativeFeedback(session.id))
    return qualitativeAnalytics.getMostFrequentSuggestion(allFeedbacks)
  }

  const calculateStats = () => {
    const totalSessions = filteredSessions.length
    
    return { totalSessions }
  }

  const { totalSessions } = calculateStats()

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

            <Card className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">核心提升点</p>
                    <p className="text-lg font-bold truncate">
                      {sessions.length > 0 ? getCoreImprovementArea() : '暂无数据'}
                    </p>
                  </div>
                  <Lightbulb className="h-8 w-8 text-orange-200" />
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
              {filteredSessions.map((session) => {
                const feedback = getQualitativeFeedback(session.id)
                // 获取最多2个亮点和2个建议
                const displayHighlights = feedback.highlights.slice(0, 2)
                const displaySuggestions = feedback.suggestions.slice(0, 2)
                
                // 根据严重性等级获取图标和样式
                const getSeverityIcon = (severity?: string) => {
                  switch (severity) {
                    case 'critical': return '❌'
                    case 'moderate': return '⚠️'
                    case 'minor': return '💡'
                    default: return '⚠️'
                  }
                }
                
                const getSeverityStyle = (severity?: string) => {
                  switch (severity) {
                    case 'critical': return 'bg-red-100 text-red-800 border-red-200'
                    case 'moderate': return 'bg-orange-100 text-orange-800 border-orange-200'
                    case 'minor': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    default: return 'bg-orange-100 text-orange-800 border-orange-200'
                  }
                }
                
                return (
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

                          {/* AI核心诊断 */}
                          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mb-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              AI核心诊断
                            </h4>
                            <div className="space-y-3">
                              {/* 亮点标签 */}
                              {displayHighlights.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-gray-600 mb-2">表现亮点</p>
                                  <div className="flex flex-wrap gap-2">
                                    {displayHighlights.map((highlight, index) => (
                                      <div key={index} className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 border border-green-200 rounded-lg">
                                        <CheckCircle className="h-4 w-4 flex-shrink-0" />
                                        <span className="text-sm font-medium truncate">
                                          {highlight.title}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* 建议标签 */}
                              {displaySuggestions.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-gray-600 mb-2">改进建议</p>
                                  <div className="flex flex-wrap gap-2">
                                    {displaySuggestions.map((suggestion, index) => (
                                      <div key={index} className={`flex items-center gap-2 px-3 py-2 border rounded-lg ${getSeverityStyle(suggestion.severity)}`}>
                                        <span className="text-sm flex-shrink-0">{getSeverityIcon(suggestion.severity)}</span>
                                        <span className="text-sm font-medium truncate">
                                          {suggestion.title}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
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
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}