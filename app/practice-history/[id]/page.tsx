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
      return '未知'
  }
}

function getScoreColor(score: number) {
  if (score >= 90) return 'text-green-600'
  if (score >= 80) return 'text-blue-600'
  if (score >= 70) return 'text-yellow-600'
  if (score >= 60) return 'text-orange-600'
  return 'text-red-600'
}

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
      
      const response = await fetch(`/api/interviews/${id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('面试记录不存在')
        } else {
          setError('获取面试详情失败')
        }
        return
      }
      
      const data = await response.json()
      setInterview(data.interview)
    } catch (error) {
      console.error('Error fetching interview detail:', error)
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-6">
              <div className="h-32 bg-gray-200 rounded-lg"></div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
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
          <h1 className="text-3xl font-bold text-gray-900">面试详情</h1>
        </div>

        {/* 面试概览 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-4">
              <span>面试概览</span>
              <Badge className={getStatusColor(interview.status)}>
                {getStatusText(interview.status)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">面试日期</p>
                  <p className="font-medium">{new Date(interview.date).toLocaleDateString('zh-CN')}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">面试时间</p>
                  <p className="font-medium">{new Date(interview.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">问题数量</p>
                  <p className="font-medium">{interview.questionCount} 题</p>
                </div>
              </div>
              
              {interview.totalScore !== null && (
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">总分</p>
                    <p className={`font-medium text-lg ${getScoreColor(interview.totalScore)}`}>
                      {interview.totalScore}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 问答详情 */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">问答详情</h2>
          
          {interview.questions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">问题 {index + 1}</span>
                  {question.score > 0 && (
                    <Badge variant="outline" className={getScoreColor(question.score)}>
                      得分: {question.score}
                    </Badge>
                  )}
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
      </div>
    </div>
  )
}