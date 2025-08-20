"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Eye, ArrowLeft } from "lucide-react"
import Link from "next/link"

// 面试记录数据接口
interface InterviewQuestion {
  id: string
  question: string
  answer: string
  feedback: string
  score: number
  createdAt: string
}

interface InterviewRecord {
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

export default function PracticeHistoryPage() {
  const [records, setRecords] = useState<InterviewRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInterviews()
  }, [])

  const fetchInterviews = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/interviews')
      
      if (!response.ok) {
        throw new Error('Failed to fetch interviews')
      }
      
      const data = await response.json()
      setRecords(data.interviews || [])
    } catch (error) {
      console.error('Error fetching interviews:', error)
      setRecords([])
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
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 页面头部 */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              返回首页
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">练习记录</h1>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">总练习次数</p>
                  <p className="text-2xl font-bold text-gray-900">{records.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">已完成</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {records.filter(r => r.status === 'completed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Eye className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">平均分数</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(
                      records
                        .filter(r => r.status === 'completed' && r.totalScore)
                        .reduce((acc, r) => acc + (r.totalScore || 0), 0) /
                      records.filter(r => r.status === 'completed' && r.totalScore).length
                    ) || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 面试记录列表 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">历史记录</h2>
          
          {records.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <Calendar className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无练习记录</h3>
                <p className="text-gray-600 mb-4">开始你的第一次面试练习吧！</p>
                <Link href="/interview-practice">
                  <Button>开始练习</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            records.map((record) => (
              <Card key={record.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">{new Date(record.date).toLocaleDateString('zh-CN')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(record.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <Badge className={getStatusColor(record.status)}>
                          {getStatusText(record.status)}
                        </Badge>
                        {record.status === 'completed' && record.totalScore && (
                          <Badge variant="outline">
                            得分: {record.totalScore}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-2">面试问题 ({record.questionCount} 题):</p>
                        <div className="space-y-1">
                          {record.questions.slice(0, 2).map((question, index) => (
                            <p key={question.id} className="text-sm text-gray-800 bg-gray-50 p-2 rounded">
                              {index + 1}. {question.question}
                            </p>
                          ))}
                          {record.questions.length > 2 && (
                            <p className="text-sm text-gray-500 italic">
                              +{record.questions.length - 2} 个更多问题...
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-6">
                      <Link href={`/practice-history/${record.id}`}>
                        <Button variant="outline" className="gap-2">
                          <Eye className="h-4 w-4" />
                          查看详情
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}