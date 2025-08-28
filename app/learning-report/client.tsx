'use client'

import { useState, useEffect } from 'react'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Clock, Target, Star, Brain, BarChart3, Home, User, FileText, Settings, Lightbulb, Award, Users, BookOpen } from 'lucide-react'
import { CompetencyAssessment } from '@/components/competency-assessment'
import { ComparisonAnalysis } from '@/components/comparison-analysis'
import { ActionableSuggestions } from '@/components/actionable-suggestions'
import { HighlightsImprovements } from '@/components/highlights-improvements'

import Navigation from '@/components/navigation'
import '@/styles/learning-report.css'

// Dynamically import Recharts components with SSR disabled
const LineChart = dynamic(() => import('recharts').then(mod => mod.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then(mod => mod.Line), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const PieChart = dynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false });

interface PracticeSession {
  id: string
  created_at: string
  overall_score: number
  content_score: number
  logic_score: number
  expression_score: number
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

interface CompetencyAnalysisData {
  competencyData: {
    name: string
    current: number
    previous: number
    historical: number
    fullMark: number
  }[]
  lastScores: {
    content_score: number
    logic_score: number
    expression_score: number
    overall_score: number
  }
  historicalAverageScores: {
    content_score: number
    logic_score: number
    expression_score: number
    overall_score: number
  }
  growthInsights: {
    id: string
    type: 'improvement' | 'strength' | 'concern' | 'opportunity'
    title: string
    description: string
    impact: 'high' | 'medium' | 'low'
  }[]
}

interface LearningReportClientProps {
  initialData: LearningReportData
}

export default function LearningReportClient({ initialData }: LearningReportClientProps) {
  const [data, setData] = useState(initialData)
  const [competencyAnalysis, setCompetencyAnalysis] = useState<CompetencyAnalysisData | null>(null)
  const [tagTrendData, setTagTrendData] = useState<TagTrendData[]>([])
  const [isLoadingCompetency, setIsLoadingCompetency] = useState(true)


  useEffect(() => {
    // 获取能力分析数据
    const fetchCompetencyAnalysis = async () => {
      try {
        setIsLoadingCompetency(true)
        const response = await fetch('/api/competency-analysis')
        if (response.ok) {
          const analysisData = await response.json()
          setCompetencyAnalysis(analysisData)
        }
      } catch (error) {
        console.error('Failed to fetch competency analysis:', error)
      } finally {
        setIsLoadingCompetency(false)
      }
    }

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

    fetchCompetencyAnalysis()
    processTagTrendData()
  }, [data])

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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left column for Total Practice Sessions */}
            <div className="lg:col-span-1">
              <Card className="bg-white rounded-2xl shadow-lg border-0 h-full">
                <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
                  <CardTitle className="text-lg font-semibold text-gray-600">
                    总练习次数
                  </CardTitle>
                  <div className="text-6xl font-bold text-gray-900 my-6">
                    {data.sessions.length}
                  </div>
                  <Link href="/practice-history" prefetch={false} className="w-full">
                    <Button variant="outline" className="w-full rounded-full">查看练习历史</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Right column for analysis */}
            <div className="lg:col-span-3">
               <div className="learning-report-card">
                 {isLoadingCompetency ? (
                   <Card>
                     <CardContent className="p-6">
                       <div className="flex items-center justify-center h-64">
                         <div className="text-center">
                           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                           <p className="text-gray-600">正在分析能力数据...</p>
                         </div>
                       </div>
                     </CardContent>
                   </Card>
                 ) : competencyAnalysis ? (
                    <Tabs defaultValue="assessment" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                        <TabsTrigger
                          value="assessment"
                          className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
                        >
                          <Target className="w-5 h-5 mr-2" />
                          能力评估
                        </TabsTrigger>
                        <TabsTrigger
                          value="comparison"
                          className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
                        >
                          <BarChart3 className="w-5 h-5 mr-2" />
                          对比分析
                        </TabsTrigger>
                        <TabsTrigger
                          value="suggestions"
                          className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
                        >
                          <Lightbulb className="w-5 h-5 mr-2" />
                          改进建议
                        </TabsTrigger>
                      </TabsList>
                     <TabsContent value="assessment" className="mt-0">
                         <div className="animate-in fade-in-50 duration-200">
                           <CompetencyAssessment 
                             competencyData={competencyAnalysis.competencyData}
                             lastScores={competencyAnalysis.lastScores}
                             historicalAverageScores={competencyAnalysis.historicalAverageScores}
                           />
                         </div>
                       </TabsContent>
                       <TabsContent value="comparison" className="mt-0">
                         <div className="animate-in fade-in-50 duration-200">
                           <ComparisonAnalysis 
                             competencyData={competencyAnalysis.competencyData}
                             lastScores={competencyAnalysis.lastScores}
                             historicalAverageScores={competencyAnalysis.historicalAverageScores}
                             growthInsights={competencyAnalysis.growthInsights}
                           />
                         </div>
                       </TabsContent>
                       <TabsContent value="suggestions" className="mt-0">
                         <div className="animate-in fade-in-50 duration-200">
                           <ActionableSuggestions 
                             competencyData={competencyAnalysis.competencyData}
                             lastScores={competencyAnalysis.lastScores}
                             historicalAverageScores={competencyAnalysis.historicalAverageScores}
                           />
                         </div>
                       </TabsContent>
                   </Tabs>
                 ) : (
                   <CompetencyAssessment />
                 )}
               </div>
             </div>




          </div>
        )}
        </div>
      </div>
    </>
  )
}