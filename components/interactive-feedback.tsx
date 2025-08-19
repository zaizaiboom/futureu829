"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Target, Lightbulb, Star, ArrowRight, CheckCircle, AlertCircle, Zap } from "lucide-react"
import { useState } from "react"

interface FeedbackData {
  overallScore: number
  rating: string
  summary: string
  highlights: Array<{
    tag: string
    description: string
  }>
  improvements: Array<{
    tag: string
    description: string
  }>
  strategicSuggestions: Array<{
    tag: string
    suggestion: string
    example: string
  }>
}

interface InteractiveFeedbackProps {
  feedback: FeedbackData
  onRetry?: () => void
  onNextQuestion?: () => void
}

export default function InteractiveFeedback({ feedback, onRetry, onNextQuestion }: InteractiveFeedbackProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "highlights" | "improvements" | "suggestions">("summary")
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedItems(newExpanded)
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "from-purple-500 to-purple-600"
    if (score >= 80) return "from-green-500 to-green-600"
    if (score >= 70) return "from-blue-500 to-blue-600"
    if (score >= 60) return "from-yellow-500 to-yellow-600"
    return "from-gray-500 to-gray-600"
  }

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <Star className="w-6 h-6 text-white" />
    if (score >= 80) return <CheckCircle className="w-6 h-6 text-white" />
    if (score >= 70) return <Target className="w-6 h-6 text-white" />
    return <AlertCircle className="w-6 h-6 text-white" />
  }

  const tabs = [
    { id: "summary", label: "总体评价", icon: TrendingUp },
    { id: "highlights", label: "亮点分析", icon: Star },
    { id: "improvements", label: "改进建议", icon: AlertCircle },
    { id: "suggestions", label: "战略建议", icon: Lightbulb },
  ]

  return (
    <div className="space-y-6">
      {/* Score Display */}
      <Card className="overflow-hidden">
        <div className={`bg-gradient-to-r ${getScoreColor(feedback.overallScore)} p-6 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">面试评估结果</h2>
              <p className="text-lg opacity-90">{feedback.rating}</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-2">
                {getScoreIcon(feedback.overallScore)}
              </div>
              <div className="text-3xl font-bold">{feedback.overallScore}</div>
              <div className="text-sm opacity-80">总分</div>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={feedback.overallScore} className="h-2 bg-white/20" />
          </div>
        </div>
      </Card>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const IconComponent = tab.icon
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              onClick={() => setActiveTab(tab.id as any)}
              className="flex items-center space-x-2"
            >
              <IconComponent className="w-4 h-4" />
              <span>{tab.label}</span>
            </Button>
          )
        })}
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-6">
          {activeTab === "summary" && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                  AI面试官的话
                </h3>
                <p className="text-gray-700 leading-relaxed">{feedback.summary}</p>
              </div>
            </div>
          )}

          {activeTab === "highlights" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Star className="w-5 h-5 mr-2 text-yellow-500" />
                你的亮点表现
              </h3>
              {feedback.highlights.map((highlight, index) => (
                <div key={index} className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Badge className="bg-green-100 text-green-800 mb-2">{highlight.tag}</Badge>
                      <p className="text-gray-700">{highlight.description}</p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "improvements" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
                需要改进的地方
              </h3>
              {feedback.improvements.map((improvement, index) => (
                <div key={index} className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                  <Badge className="bg-orange-100 text-orange-800 mb-2">{improvement.tag}</Badge>
                  <p className="text-gray-700">{improvement.description}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === "suggestions" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Lightbulb className="w-5 h-5 mr-2 text-purple-500" />
                战略提升建议
              </h3>
              {feedback.strategicSuggestions.map((suggestion, index) => (
                <div key={index} className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                  <div className="space-y-3">
                    <Badge className="bg-purple-100 text-purple-800">{suggestion.tag}</Badge>
                    <p className="text-gray-700">{suggestion.suggestion}</p>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(index)}
                      className="text-purple-600 hover:text-purple-700 p-0 h-auto"
                    >
                      {expandedItems.has(index) ? "收起示例" : "查看具体示例"}
                      <ArrowRight
                        className={`w-4 h-4 ml-1 transition-transform ${expandedItems.has(index) ? "rotate-90" : ""}`}
                      />
                    </Button>

                    {expandedItems.has(index) && (
                      <div className="bg-white p-3 rounded border border-purple-200">
                        <p className="text-sm text-gray-600 font-medium mb-1">具体示例：</p>
                        <p className="text-sm text-gray-700">{suggestion.example}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {onRetry && (
          <Button variant="outline" onClick={onRetry} className="flex items-center space-x-2 bg-transparent">
            <Zap className="w-4 h-4" />
            <span>重新回答这道题</span>
          </Button>
        )}
        {onNextQuestion && (
          <Button
            onClick={onNextQuestion}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600"
          >
            <span>继续下一题</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
