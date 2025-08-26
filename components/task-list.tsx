'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  Clock, 
  BookOpen, 
  Target, 
  Brain,
  Calendar
} from 'lucide-react'

interface TaskItem {
  id: string
  type: 'knowledge' | 'practice' | 'mindset'
  title: string
  description: string
  completed: boolean
}

interface Task {
  id: string
  title: string
  interviewDate: string
  status: 'pending' | 'in_progress' | 'completed'
  items: TaskItem[]
  priority: 'high' | 'medium' | 'low'
}

interface TaskListProps {
  tasks?: Task[]
}

// 模拟数据
const defaultTasks: Task[] = [
  {
    id: 'task-1',
    title: '任务1（2025年8月20日面试）',
    interviewDate: '2025-08-20',
    status: 'in_progress',
    priority: 'high',
    items: [
      {
        id: 'item-1-1',
        type: 'knowledge',
        title: '重新学习"MVP"和"A/B测试"的相关知识',
        description: '深入理解最小可行产品的概念和A/B测试的实施方法',
        completed: true
      },
      {
        id: 'item-1-2',
        type: 'practice',
        title: '完成3道产品策略相关的练习题',
        description: '重点练习市场分析和竞品分析类题目',
        completed: false
      },
      {
        id: 'item-1-3',
        type: 'mindset',
        title: '培养结构化思维习惯',
        description: '使用MECE原则组织回答，确保逻辑清晰',
        completed: false
      }
    ]
  },
  {
    id: 'task-2',
    title: '任务2（2025年8月25日面试）',
    interviewDate: '2025-08-25',
    status: 'pending',
    priority: 'medium',
    items: [
      {
        id: 'item-2-1',
        type: 'knowledge',
        title: '学习用户体验设计原则',
        description: '掌握UX设计的基本原则和方法论',
        completed: false
      },
      {
        id: 'item-2-2',
        type: 'practice',
        title: '练习用户需求分析',
        description: '通过案例分析提升用户洞察能力',
        completed: false
      },
      {
        id: 'item-2-3',
        type: 'mindset',
        title: '建立用户导向思维',
        description: '在分析问题时始终以用户价值为出发点',
        completed: false
      }
    ]
  },
  {
    id: 'task-3',
    title: '任务3（2025年9月1日面试）',
    interviewDate: '2025-09-01',
    status: 'completed',
    priority: 'low',
    items: [
      {
        id: 'item-3-1',
        type: 'knowledge',
        title: '复习数据分析基础',
        description: '巩固SQL和Excel数据处理技能',
        completed: true
      },
      {
        id: 'item-3-2',
        type: 'practice',
        title: '完成数据解读练习',
        description: '练习从数据中提取业务洞察',
        completed: true
      }
    ]
  }
]

export function TaskList({ tasks = defaultTasks }: TaskListProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())

  const toggleTask = (taskId: string) => {
    const newExpanded = new Set(expandedTasks)
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId)
    } else {
      newExpanded.add(taskId)
    }
    setExpandedTasks(newExpanded)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pending':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成'
      case 'in_progress':
        return '进行中'
      case 'pending':
        return '待开始'
      default:
        return '未知'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'knowledge':
        return <BookOpen className="h-4 w-4 text-blue-600" />
      case 'practice':
        return <Target className="h-4 w-4 text-green-600" />
      case 'mindset':
        return <Brain className="h-4 w-4 text-purple-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'knowledge':
        return '知识补充'
      case 'practice':
        return '实战练习'
      case 'mindset':
        return '思维习惯'
      default:
        return '其他'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'knowledge':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'practice':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'mindset':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  return (
    <Card className="shadow-lg border-0 bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <span className="text-2xl">📝</span>
          任务清单
        </CardTitle>
        <p className="text-gray-600 text-sm">个性化学习任务与面试准备计划</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.map((task) => {
            const isExpanded = expandedTasks.has(task.id)
            const completedItems = task.items.filter(item => item.completed).length
            const totalItems = task.items.length
            const completionRate = totalItems > 0 ? (completedItems / totalItems) * 100 : 0

            return (
              <div 
                key={task.id}
                className={`task-card border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow ${isExpanded ? 'expanded' : ''}`}
              >
                {/* 任务头部 */}
                <div 
                  className="task-header p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleTask(task.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-600" />
                        <h3 className="font-semibold text-gray-900">{task.title}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getStatusColor(task.status)}`}
                        >
                          {getStatusText(task.status)}
                        </Badge>
                        <Badge 
                          className={`priority-badge ${
                            task.priority === 'high' ? 'priority-high' :
                            task.priority === 'medium' ? 'priority-medium' :
                            'priority-low'
                          }`}
                        >
                          {task.priority === 'high' ? '高优先级' : task.priority === 'medium' ? '中优先级' : '低优先级'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-600">
                        {completedItems}/{totalItems} 已完成
                      </div>
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-600" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                  </div>
                </div>

                {/* 任务详情 */}
                {isExpanded && (
                  <div className="task-content p-4 bg-white border-t border-gray-200">
                    <div className="space-y-3">
                      {task.items.map((item) => (
                        <div 
                          key={item.id}
                          className={`p-3 rounded-lg border transition-all ${
                            item.completed 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                              {item.completed ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                getTypeIcon(item.type)
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${getTypeColor(item.type)}`}
                                >
                                  {getTypeText(item.type)}
                                </Badge>
                                <h4 className={`font-medium ${
                                  item.completed ? 'text-green-900 line-through' : 'text-gray-900'
                                }`}>
                                  {item.title}
                                </h4>
                              </div>
                              <p className={`text-sm leading-relaxed ${
                                item.completed ? 'text-green-700' : 'text-gray-600'
                              }`}>
                                {item.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}