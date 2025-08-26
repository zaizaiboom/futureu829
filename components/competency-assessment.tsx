'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend
} from 'recharts'

interface CompetencyData {
  name: string
  current: number
  previous: number
  fullMark: number
}

interface GrowthInsight {
  competency: string
  status: 'progress' | 'stagnant' | 'decline'
  description: string
  change: string
}

interface CompetencyAssessmentProps {
  competencyData?: CompetencyData[]
  growthInsights?: GrowthInsight[]
}

// 模拟数据
const defaultCompetencyData: CompetencyData[] = [
  { name: '战略思维力', current: 75, previous: 65, fullMark: 100 },
  { name: '落地执行力', current: 80, previous: 75, fullMark: 100 },
  { name: '沟通表达力', current: 70, previous: 72, fullMark: 100 },
  { name: '团队协作力', current: 85, previous: 80, fullMark: 100 },
  { name: '创新思维力', current: 68, previous: 60, fullMark: 100 },
  { name: '学习适应力', current: 90, previous: 85, fullMark: 100 }
]

const defaultGrowthInsights: GrowthInsight[] = [
  {
    competency: '战略思维力',
    status: 'progress',
    description: '从基础具备提升至初步成型。你开始在回答中融入市场分析和竞品考量，展现出更全面的思考视角。',
    change: '+10分'
  },
  {
    competency: '学习适应力',
    status: 'progress', 
    description: '持续保持优秀水平。你能够快速理解新概念并灵活运用，这是你的核心优势。',
    change: '+5分'
  },
  {
    competency: '沟通表达力',
    status: 'decline',
    description: '略有下降，需要关注。建议在回答时更注重逻辑结构和表达清晰度。',
    change: '-2分'
  },
  {
    competency: '创新思维力',
    status: 'progress',
    description: '显著提升。你开始提出更多创新性的解决方案，思维更加发散和灵活。',
    change: '+8分'
  },
  {
    competency: '落地执行力',
    status: 'progress',
    description: '执行能力稳步提升，建议继续实践项目管理。',
    change: '+5分'
  },
  {
    competency: '团队协作力',
    status: 'progress',
    description: '协作能力优秀，团队互动更顺畅。',
    change: '+5分'
  }
]

export function CompetencyAssessment({ 
  competencyData = defaultCompetencyData,
  growthInsights = defaultGrowthInsights 
}: CompetencyAssessmentProps) {
  
  // 准备雷达图数据
  const radarData = competencyData.map(item => ({
    subject: item.name,
    本次状态: item.current,
    上次状态: item.previous,
    fullMark: item.fullMark
  }))

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'progress':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'decline':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'progress':
        return 'text-green-600'
      case 'decline':
        return 'text-red-600'
      default:
        return 'text-yellow-600'
    }
  }

  return (
    <Card className="shadow-lg border-0 bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <span className="text-2xl">📈</span>
          核心能力评估与成长路径
        </CardTitle>
        <p className="text-gray-600 text-sm">基于最近练习数据的能力分析与发展建议</p>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* 雷达图部分 */}
        <div className="mb-8 radar-chart-container">
          <h3 className="text-lg font-semibold mb-4 text-center">能力雷达图</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" className="text-sm" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} className="text-xs" />
                <Radar
                  name="上次状态"
                  dataKey="上次状态"
                  stroke="#d1d5db"
                  fill="#d1d5db"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Radar
                  name="本次状态"
                  dataKey="本次状态"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.4}
                  strokeWidth={3}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 成长洞察部分 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">成长洞察</h3>
          <div className="space-y-4">
            {growthInsights.map((insight, index) => (
              <div 
                key={index}
                className="growth-insight-card flex items-start gap-4 p-4 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(insight.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900">{insight.competency}</h4>
                    <Badge 
                      variant="outline" 
                      className={`${getStatusColor(insight.status)} border-current`}
                    >
                      {insight.change}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}