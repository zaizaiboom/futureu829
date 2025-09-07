'use client'

import { useState } from 'react'
import Link from 'next/link'
import Navigation from '@/components/navigation'
import ActionHandbook from './action-handbook'
import GrowthPath from './growth-path'
import FourPillars from './four-pillars'
import { Button } from '@/components/ui/button'

interface LearningReportData {
  sessions: any[]
  totalSessions: number
  diagnosis: any
  actionHandbook: any
  growthData: any[]
  abilities: string[]
}

interface LearningReportClientProps {
  initialData: LearningReportData
}

export default function LearningReportClient({ initialData }: LearningReportClientProps) {
  const [activeModule, setActiveModule] = useState('pillars')

  const latestGrowth = initialData.growthData[initialData.growthData.length - 1] || {};
  const scores = initialData.abilities.map(ability => latestGrowth[ability] || 0);

  const modules = {
    pillars: { title: '四能力详解', component: <FourPillars abilities={initialData.abilities} scores={scores} /> },
    handbook: { title: '今日行动手册', component: <ActionHandbook improvementArea={initialData.actionHandbook.improvementArea} recommendedArticle={initialData.actionHandbook.recommendedArticle} practiceQuestion={initialData.actionHandbook.practiceQuestion} thinkingTool={initialData.actionHandbook.thinkingTool} /> },
    growth: { title: '个人成长路径', component: <GrowthPath data={initialData.growthData} abilities={initialData.abilities} /> }
  }

  return (
    <>
      <Navigation currentPage="learning-report" />
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-baseline gap-3">
                <h1 className="text-3xl font-bold text-gray-900">学习报告</h1>
                <span className="text-gray-600 font-medium">总练习次数: {initialData.totalSessions}</span>
              </div>
              <Link href="/practice-history" prefetch={false}>
                查看练习历史
              </Link>
            </div>
          </div>
          <div className="flex">
            <div className="w-48 pr-4">
              {Object.keys(modules).map(key => (
                <Button
                  key={key}
                  variant={activeModule === key ? 'default' : 'ghost'}
                  className="w-full justify-start mb-2"
                  onClick={() => setActiveModule(key)}
                >
                  {modules[key].title}
                </Button>
              ))}
            </div>
            <div className="flex-1">
              {modules[activeModule].component}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}