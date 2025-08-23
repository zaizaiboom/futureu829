"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, Target, Lightbulb, Star, ArrowRight, CheckCircle, AlertCircle, Zap, Brain, BarChart3, ThumbsUp, ThumbsDown, MessageSquareQuestion } from "lucide-react"
import { useState } from "react"
import { AggregatedReport, IndividualEvaluationResponse } from "@/types/evaluation"

// 定义组件接受的反馈数据类型
type FeedbackData = AggregatedReport | IndividualEvaluationResponse

interface InteractiveFeedbackProps {
  feedback: FeedbackData
  onRetry?: () => void
  onNextQuestion?: () => void
}

// 类型检查函数
const isAggregatedReport = (data: FeedbackData): data is AggregatedReport => {
  return 'individualEvaluations' in data && 'overallSummary' in data
}

const isIndividualEvaluation = (data: FeedbackData): data is IndividualEvaluationResponse => {
  return 'performanceLevel' in data && 'preliminaryAnalysis' in data
}

export default function InteractiveFeedback({ feedback, onRetry, onNextQuestion }: InteractiveFeedbackProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "strengths" | "improvements">("summary")
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleExpanded = (key: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedItems(newExpanded)
  }

  // 获取当前反馈的等级
  const getCurrentLevel = (): string => {
    if (isAggregatedReport(feedback)) {
      return feedback.overallSummary.overallLevel
    }
    if (isIndividualEvaluation(feedback)) {
      return feedback.performanceLevel
    }
    return "无法评估"
  }

  // 获取当前反馈的总结
  const getCurrentSummary = (): string => {
    if (isAggregatedReport(feedback)) {
      return feedback.overallSummary.overallSummary
    }
    if (isIndividualEvaluation(feedback)) {
      return feedback.summary
    }
    return "暂无评估总结"
  }

  const getLevelInfo = (level: string) => {
    switch (level) {
      case "导演级": return { color: "from-purple-500 to-purple-600", icon: <Star className="w-6 h-6 text-white" /> }
      case "制片级": return { color: "from-green-500 to-green-600", icon: <CheckCircle className="w-6 h-6 text-white" /> }
      case "编剧级": return { color: "from-blue-500 to-blue-600", icon: <Target className="w-6 h-6 text-white" /> }
      case "助理级": return { color: "from-yellow-500 to-yellow-600", icon: <AlertCircle className="w-6 h-6 text-white" /> }
      default: return { color: "from-gray-500 to-gray-600", icon: <AlertCircle className="w-6 h-6 text-white" /> }
    }
  }

  const currentLevel = getCurrentLevel()
  const currentSummary = getCurrentSummary()
  const levelInfo = getLevelInfo(currentLevel)

  const tabs = [
    { id: "summary", label: "总体评价", icon: TrendingUp },
    { id: "strengths", label: "表现亮点", icon: ThumbsUp },
    { id: "improvements", label: "改进建议", icon: Lightbulb },
  ]

  const renderPreliminaryAnalysis = (evaluation: IndividualEvaluationResponse) => (
    <div className={`p-4 rounded-lg border-l-4 ${evaluation.preliminaryAnalysis.isValid ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
        {evaluation.preliminaryAnalysis.isValid 
          ? <CheckCircle className="w-5 h-5 mr-2 text-green-600" /> 
          : <AlertCircle className="w-5 h-5 mr-2 text-red-600" />}
        初步分析：回答有效性
      </h4>
      <p className="text-gray-700 leading-relaxed">{evaluation.preliminaryAnalysis.reasoning}</p>
    </div>
  )

  const renderStrengths = (strengths: IndividualEvaluationResponse['strengths']) => (
    strengths.map((strength, index) => (
      <div key={`strength-${index}`} className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Badge className="bg-green-100 text-green-800 mb-2">{strength.area}</Badge>
            <p className="text-gray-700">{strength.description}</p>
          </div>
          <ThumbsUp className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
        </div>
      </div>
    ))
  )

  const renderImprovements = (improvements: IndividualEvaluationResponse['improvements']) => (
    improvements.map((improvement, index) => {
      const key = `improvement-${index}`
      return (
        <div key={key} className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
          <div className="space-y-3">
            <Badge className="bg-orange-100 text-orange-800">{improvement.area}</Badge>
            <p className="text-gray-700">{improvement.suggestion}</p>
            {improvement.example && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpanded(key)}
                  className="text-orange-600 hover:text-orange-700 p-0 h-auto"
                >
                  {expandedItems.has(key) ? "收起示例" : "查看具体示例"}
                  <ArrowRight className={`w-4 h-4 ml-1 transition-transform ${expandedItems.has(key) ? "rotate-90" : ""}`} />
                </Button>
                {expandedItems.has(key) && (
                  <div className="bg-white p-3 rounded border border-orange-200">
                    <p className="text-sm text-gray-600 font-medium mb-1">参考示例：</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap font-mono">{improvement.example}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )
    })
  )
  
  const renderFollowUpQuestion = (question: string) => (
    <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
        <MessageSquareQuestion className="w-5 h-5 mr-2 text-purple-600" />
        深度追问
      </h4>
      <p className="text-gray-700 leading-relaxed">{question}</p>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Level Display */}
      <Card className="overflow-hidden">
        <div className={`bg-gradient-to-r ${levelInfo.color} p-6 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">AI面试教练评估</h2>
              <p className="text-lg opacity-90">
                {isAggregatedReport(feedback) ? `套题评估 (${feedback.stageInfo.questionCount}题)` : "单题评估"}
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-2">
                {levelInfo.icon}
              </div>
              <div className="text-2xl font-bold">{currentLevel}</div>
              <div className="text-sm opacity-80">表现评级</div>
            </div>
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
                  AI教练总结
                </h3>
                <p className="text-gray-700 leading-relaxed">{currentSummary}</p>
              </div>
              
              {isIndividualEvaluation(feedback) && renderPreliminaryAnalysis(feedback)}

              {isAggregatedReport(feedback) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">题目数量</h4>
                    <p className="text-2xl font-bold text-blue-600">{feedback.stageInfo.questionCount}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">评估阶段</h4>
                    <p className="text-lg font-semibold text-gray-700">{feedback.stageInfo.stageTitle}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">评估时间</h4>
                    <p className="text-sm text-gray-600">{new Date(feedback.timestamp).toLocaleString('zh-CN')}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "strengths" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <ThumbsUp className="w-5 h-5 mr-2 text-green-500" />
                表现亮点
              </h3>
              {isIndividualEvaluation(feedback) && renderStrengths(feedback.strengths)}
              {isAggregatedReport(feedback) && feedback.individualEvaluations.map((evaluation, index) => (
                <div key={`eval-strength-${index}`} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-4">
                  <h4 className="font-medium text-gray-900 mb-3">第{index + 1}题 亮点</h4>
                  {renderStrengths(evaluation.strengths)}
                </div>
              ))}
            </div>
          )}

          {activeTab === "improvements" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Lightbulb className="w-5 h-5 mr-2 text-orange-500" />
                改进建议
              </h3>
              {isIndividualEvaluation(feedback) && (
                <>
                  {renderImprovements(feedback.improvements)}
                  {feedback.followUpQuestion && renderFollowUpQuestion(feedback.followUpQuestion)}
                </>
              )}
              {isAggregatedReport(feedback) && feedback.individualEvaluations.map((evaluation, index) => (
                <div key={`eval-improvement-${index}`} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-4">
                  <h4 className="font-medium text-gray-900 mb-3">第{index + 1}题 改进建议</h4>
                  {renderImprovements(evaluation.improvements)}
                  {evaluation.followUpQuestion && renderFollowUpQuestion(evaluation.followUpQuestion)}
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
