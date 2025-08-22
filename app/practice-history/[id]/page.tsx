"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, ArrowLeft, MessageSquare, Star } from "lucide-react"
import Link from "next/link"

interface InterviewQuestion {
  id: string
  question: string
  answer: string
  feedback: string
  score: number
  createdAt: string
}

interface InterviewDetail {
  id: string
  date: string
  completedAt: string | null
  totalScore: number | null
  status: 'completed' | 'in-progress' | 'failed'
  questionCount: number
  stageName?: string
  categoryName?: string
  scores?: {
    content: number
    logic: number
    expression: number
  }
  duration?: number
  question?: string
  aiFeedback?: any
  questions: InterviewQuestion[]
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'in-progress':
      return 'bg-yellow-100 text-yellow-800'
    case 'failed':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'completed':
      return '已完成'
    case 'in-progress':
      return '进行中'
    case 'failed':
      return '已失败'
    default:
      return '未知状态'
  }
}

// 移除评分颜色函数

export default function InterviewDetailPage() {
  const params = useParams()
  const [interview, setInterview] = useState<InterviewDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchInterviewDetail(params.id as string)
    }
  }, [params.id])

  const fetchInterviewDetail = async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 模拟数据
      const mockData: InterviewDetail = {
        id,
        date: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        totalScore: 85,
        status: 'completed',
        questionCount: 3,
        stageName: 'HR面试',
        categoryName: '行为面试',
        scores: {
          content: 88,
          logic: 82,
          expression: 85
        },
        duration: 1800,
        question: '请介绍一下你自己，包括你的教育背景、工作经验和个人特长。',
        aiFeedback: {
          coreDiagnosis: '整体表现良好，逻辑清晰，表达流畅。在自我介绍环节展现了良好的沟通能力。',
          highlights: [
            { point: '表达清晰', explanation: '语言组织能力强，逻辑层次分明' },
            { point: '内容丰富', explanation: '涵盖了教育背景、工作经验等关键信息' }
          ],
          suggestions: [
            { point: '增强自信', actionable: '可以在回答时保持更加自信的语调和姿态' }
          ],
          interviewerReaction: '面试官对候选人的回答表示满意，认为表达清晰且内容充实。'
        },
        questions: [
          {
            id: '1',
            question: '请介绍一下你自己',
            answer: '我是一名计算机科学专业的学生，有丰富的项目经验...',
            feedback: '回答全面，逻辑清晰，很好地展示了个人背景和能力。',
            score: 85,
            createdAt: new Date().toISOString()
          }
        ]
      }
      
      setInterview(mockData)
    } catch (err) {
      setError('获取面试详情失败')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">加载中...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !interview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/practice-history">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                返回列表
              </Button>
            </Link>
          </div>
          
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <MessageSquare className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{error || '面试记录不存在'}</h3>
              <p className="text-gray-600 mb-4">请检查链接是否正确或稍后重试</p>
              <Link href="/practice-history">
                <Button>返回列表</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 页面头部 */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/practice-history">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              返回列表
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">练习详情</h1>
        </div>

        {/* 练习概览 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-4">
              <span>练习概览</span>
              <Badge className={getStatusColor(interview.status)}>
                {getStatusText(interview.status)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">练习日期</p>
                  <p className="font-medium">{new Date(interview.date).toLocaleDateString('zh-CN')}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">练习时间</p>
                  <p className="font-medium">{new Date(interview.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
              
              {interview.stageName && (
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">面试阶段</p>
                    <p className="font-medium">{interview.stageName}</p>
                  </div>
                </div>
              )}
              
              {interview.categoryName && (
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">题目分类</p>
                    <p className="font-medium">{interview.categoryName}</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* 移除评分详情部分 */}
          </CardContent>
        </Card>

        {/* 练习题目 */}
        {interview.question && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>练习题目</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 p-6 rounded-lg">
                <p className="text-gray-800 text-lg leading-relaxed">{interview.question}</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* AI评估反馈 */}
        {interview.aiFeedback && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>AI评估反馈</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* 核心诊断 */}
                {interview.aiFeedback.coreDiagnosis && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">核心诊断</h4>
                    <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                      <p className="text-gray-800">{interview.aiFeedback.coreDiagnosis}</p>
                    </div>
                  </div>
                )}
                
                {/* 亮点分析 */}
                {interview.aiFeedback.highlights && interview.aiFeedback.highlights.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">亮点分析</h4>
                    <div className="space-y-2">
                      {interview.aiFeedback.highlights.map((highlight: any, index: number) => (
                        <div key={index} className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                          <p className="font-medium text-green-800">{highlight.point}</p>
                          <p className="text-green-700 text-sm mt-1">{highlight.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 改进建议 */}
                {interview.aiFeedback.suggestions && interview.aiFeedback.suggestions.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">改进建议</h4>
                    <div className="space-y-2">
                      {interview.aiFeedback.suggestions.map((suggestion: any, index: number) => (
                        <div key={index} className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-400">
                          <p className="font-medium text-orange-800">{suggestion.point}</p>
                          <p className="text-orange-700 text-sm mt-1">{suggestion.actionable}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 面试官反应 */}
                {interview.aiFeedback.interviewerReaction && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">面试官反应</h4>
                    <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
                      <p className="text-purple-800 italic">"{interview.aiFeedback.interviewerReaction}"</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* 问答详情 */}
        {interview.questions && interview.questions.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">问答详情</h2>
            
            {interview.questions.map((question, index) => (
              <Card key={question.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                     <span className="text-lg">问题 {index + 1}</span>
                   </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 问题 */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">面试问题:</h4>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-gray-800">{question.question}</p>
                    </div>
                  </div>
                  
                  {/* 回答 */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">我的回答:</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-800 whitespace-pre-wrap">{question.answer || '暂无回答'}</p>
                    </div>
                  </div>
                  
                  {/* AI反馈 */}
                  {question.feedback && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">AI 反馈:</h4>
                      <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                        <p className="text-gray-800 whitespace-pre-wrap">{question.feedback}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}