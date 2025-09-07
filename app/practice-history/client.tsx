'use client'

import { useState, useEffect, useMemo } from 'react'
import { User } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Calendar, Filter, Clock, Eye, Target, CheckCircle, AlertTriangle, Lightbulb, History, Info } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import Link from 'next/link'
import Navigation from '@/components/navigation'
import { generateMockQualitativeFeedback, qualitativeAnalytics } from '@/lib/qualitative-analytics'
import { QualitativeFeedback } from '@/types/qualitative-feedback'
import { PracticeSession } from '@/types/practice-session';
// Remove import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
// Remove import { Heart } from 'lucide-react';
// Remove import { FavoriteButton } from "@/components/ui/favorite-button"

interface FilterOptions {
  stage: string
  category: string
  dateRange: string
  sortBy: string
}

interface PracticeHistoryClientProps {
  user: User
  sessions: PracticeSession[]
  totalSessions: number
  stages: string[]
  categories: string[]
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

export function PracticeHistoryClient({ user, sessions, totalSessions, stages, categories }: PracticeHistoryClientProps) {
  const [filteredSessions, setFilteredSessions] = useState<PracticeSession[]>(sessions)
  const [filters, setFilters] = useState<FilterOptions>({
    stage: 'all',
    category: 'all',
    dateRange: 'all',
    sortBy: 'created_at_desc'
  })

  const [coreImprovementArea, setCoreImprovementArea] = useState<string>('暂无数据')

  useEffect(() => {
    // 基于已有的 sessions 数据计算核心提升点
    if (sessions && sessions.length > 0) {
      const allFeedback = sessions.map(s => s.qualitative_feedback).filter(Boolean) as QualitativeFeedback[];
      if (allFeedback.length > 0) {
        const growthAdvice = qualitativeAnalytics.generateGrowthAdvice(allFeedback);
        console.log('Setting core improvement area:', growthAdvice);
        setCoreImprovementArea(growthAdvice);
      } else {
        setCoreImprovementArea('暂无数据');
      }
    } else {
      setCoreImprovementArea('暂无数据');
    }
  }, [sessions]);

  useEffect(() => {
    applyFilters()
  }, [sessions, filters])

  const applyFilters = () => {
    let filtered = [...sessions]

    // 按阶段筛选
    if (filters.stage !== 'all') {
      filtered = filtered.filter(session => session.interview_stages?.stage_name === filters.stage)
    }

    // 默认按创建时间降序排序
    filtered.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    setFilteredSessions(filtered)
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

  // 按时间分组会话
  const groupSessions = (sessions: PracticeSession[]) => {
    const sorted = [...sessions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const groups: PracticeSession[][] = [];
    let currentGroup: PracticeSession[] = [];
    sorted.forEach((session, index) => {
      if (currentGroup.length === 0 || 
          Math.abs(new Date(session.created_at).getTime() - new Date(currentGroup[0].created_at).getTime()) < 5 * 60 * 1000) { // within 5 minutes
        currentGroup.push(session);
      } else {
        groups.push(currentGroup);
        currentGroup = [session];
      }
      if (index === sorted.length - 1) groups.push(currentGroup);
    });
    return groups;
  };

  const sessionGroups = useMemo(() => groupSessions(filteredSessions), [filteredSessions]);

  const getQualitativeFeedback = (sessionId: string): QualitativeFeedback | undefined => {
    const session = filteredSessions.find(s => s.id === sessionId);
    return session?.qualitative_feedback;
  }

  // 获取核心提升点
  const getCoreImprovementArea = () => {
    // 确保返回字符串
    if (typeof coreImprovementArea === 'string') {
      return coreImprovementArea;
    }
    if(coreImprovementArea && typeof coreImprovementArea === 'object'){
      return JSON.stringify(coreImprovementArea);
    }
    return '暂无数据';
  }

  const calculateStats = () => {
    const filteredSessionsCount = filteredSessions.length

    return { filteredSessionsCount }
  }

  const { filteredSessionsCount } = calculateStats()

  return (
    <>
      <Navigation currentPage="practice-history" />
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* 页面标题 */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">练习记录</h1>
              <p className="text-gray-600">回顾你的面试练习历程，追踪进步轨迹</p>
            </div>
          </div>

          {/* 筛选和排序工具栏 */}
          <Card className="mb-6 border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                  <Filter className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-semibold text-gray-700">筛选条件</span>
                </div>
                
                {/* 面试阶段筛选 */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">面试阶段:</span>
                  <Select value={filters.stage} onValueChange={(value) => setFilters(prev => ({ ...prev, stage: value }))}>
                    <SelectTrigger className="w-36 border-purple-200 focus:border-purple-400 focus:ring-purple-200">
                      <SelectValue placeholder="选择阶段" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部阶段</SelectItem>
                      {stages.map((stage, index) => (
                        <SelectItem key={index} value={stage}>
                          {stage}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-4xl mx-auto">
            <Card className="bg-gradient-to-r from-orange-400 to-yellow-400 text-white flex flex-col">
              <CardContent className="p-6 flex-grow flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p className="text-orange-100 text-sm">核心提升点</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-orange-200 cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>基于所有练习的AI定性评估，提炼出的最需要关注和提升的能力领域。</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Lightbulb className="h-8 w-8 text-orange-200" />
                </div>
                <p className="text-base font-semibold flex-grow">
                  {sessions.length > 0 ? getCoreImprovementArea() : '暂无数据'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white flex flex-col">
              <CardContent className="p-6 flex-grow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">筛选结果</p>
                    <p className="text-3xl font-bold">{filteredSessionsCount}</p>
                    <p className="text-green-100 text-xs mt-1">条练习记录</p>
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
            <div className="relative border-l-2 border-gray-200 pl-8 space-y-10">
              {sessionGroups.map((group, groupIndex) => (
                <div key={groupIndex} className="relative">
                  <div className="absolute -left-[3.2rem] top-1 flex items-center">
                    <span className="h-4 w-4 bg-white border-2 border-purple-500 rounded-full"></span>
                    <div className="w-8 border-t-2 border-gray-200"></div>
                  </div>
                  <Card className="transition-all duration-300 hover:shadow-xl border rounded-xl overflow-hidden">
                    <CardHeader className="p-4 bg-gray-50 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-gray-500" />
                          <span className="font-semibold text-gray-800">
                            {format(new Date(group[0].created_at), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                          </span>
                        </div>
                        <Button asChild>
                          <Link href={`/practice-history/group/${group[0].id}`}>
                            查看详情
                          </Link>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="mb-5">
                        <p className="text-gray-800 font-medium">面试套题 ({group.length} 道题)</p>
                        <Badge className="mt-2">{group[0].interview_stages?.stage_name || '未知模块'}</Badge>
                      </div>
                      <ul className="space-y-2 mt-4">
                        {group.map((session, index) => (
                          <li key={index} className="flex justify-between items-center border-b py-2">
                            <span>{session.interview_questions?.question_text}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}