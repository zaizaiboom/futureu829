"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, Target, Zap, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface QuickTipsProps {
  stage: "hr" | "professional" | "final"
}

export function QuickTips({ stage }: QuickTipsProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const tips = {
    hr: [
      {
        icon: <Target className="h-4 w-4" />,
        tip: "开头模板",
        template: "我有X年相关经验，专门负责过Y类AI产品，最擅长Z技能领域",
      },
      {
        icon: <Zap className="h-4 w-4" />,
        tip: "成果量化",
        template: "在上个项目中，我通过XX方法，实现了YY%的用户增长/转化提升",
      },
      {
        icon: <Lightbulb className="h-4 w-4" />,
        tip: "主动提问",
        template: "我想了解这个岗位最大的挑战是什么？团队现在最需要什么样的支持？",
      },
    ],
    professional: [
      {
        icon: <Target className="h-4 w-4" />,
        tip: "结论先行",
        template: "我的建议是XX，主要基于三个考虑：用户需求、技术可行性、商业价值",
      },
      {
        icon: <Zap className="h-4 w-4" />,
        tip: "技术落地",
        template: "从技术角度，我会选择XX方案，因为它能在保证效果的同时控制成本",
      },
      {
        icon: <Lightbulb className="h-4 w-4" />,
        tip: "数据支撑",
        template: "根据我的经验，这样的优化通常能带来XX%的关键指标提升",
      },
    ],
    final: [
      {
        icon: <Target className="h-4 w-4" />,
        tip: "战略思维",
        template: "从行业趋势看，我认为这个问题的核心是XX，需要从长远角度考虑",
      },
      {
        icon: <Zap className="h-4 w-4" />,
        tip: "格局展现",
        template: "我会从用户价值、技术可行性、商业模式三个维度来系统分析",
      },
      {
        icon: <Lightbulb className="h-4 w-4" />,
        tip: "决心表达",
        template: "我对这个机会非常认真，已经深入研究了贵公司的产品和发展方向",
      },
    ],
  }

  const stageNames = {
    hr: "HR面试",
    professional: "专业面试",
    final: "终面",
  }

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error("复制失败:", err)
    }
  }

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-5 w-5 text-yellow-500" />
        <h3 className="font-semibold text-gray-800">{stageNames[stage]} 高分模板</h3>
        <Badge variant="secondary" className="text-xs">
          直接套用
        </Badge>
      </div>
      <div className="space-y-3">
        {tips[stage].map((item, index) => (
          <div key={index} className="bg-white rounded-lg border p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-blue-500">{item.icon}</div>
              <span className="text-sm font-medium text-gray-800">{item.tip}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded border-l-4 border-l-blue-400">
              <p className="text-sm text-gray-700 leading-relaxed mb-2">"{item.template}"</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(item.template, index)}
                className="h-6 px-2 text-xs"
              >
                <Copy className="h-3 w-3 mr-1" />
                {copiedIndex === index ? "已复制" : "复制模板"}
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-blue-200">
        <p className="text-xs text-blue-600 text-center">💡 把模板中的XX、YY替换成你的具体内容，立即提升回答质量</p>
      </div>
    </Card>
  )
}
