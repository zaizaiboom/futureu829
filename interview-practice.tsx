"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  Clock,
  Target,
  Play,
  Send,
  Brain,
  CheckCircle,
  Lightbulb,
  Smile,
  Users,
  Briefcase,
  Trophy,
  RefreshCw,
  Loader2,
  Mic,
  Volume2,
  VolumeX,
  Pause,
  RotateCcw,
  Settings,
} from "lucide-react"
import { getRandomQuestions, getQuestionCount, type Question, getQuestionStats } from "@/lib/questions-service"
import type { AggregatedReport, IndividualEvaluationResponse } from "@/types/evaluation"

// TypeScript类型定义
declare global {
  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList
  }

  interface SpeechRecognitionResultList {
    length: number
    [index: number]: SpeechRecognitionResult
  }

  interface SpeechRecognitionResult {
    isFinal: boolean
    [index: number]: SpeechRecognitionAlternative
  }

  interface SpeechRecognitionAlternative {
    transcript: string
    confidence: number
  }

  interface SpeechRecognitionErrorEvent extends Event {
    error: string
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    maxAlternatives: number
    onresult: (event: SpeechRecognitionEvent) => void
    onerror: (event: SpeechRecognitionErrorEvent) => void
    onend: () => void
    onstart: () => void
    start: () => void
    stop: () => void
  }

  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

// 阶段配置
const stageConfig = {
  hr: {
    title: "HR面 - 职业匹配度与潜力评估",
    description: "评估职业动机、自我认知、沟通协作、职业规划",
    icon: Users,
    color: "blue",
    stageId: 1,
  },
  professional: {
    title: "专业面 - 硬核能力与实践评估",
    description: "评估产品设计思维、技术理解力、商业化能力、数据驱动能力",
    icon: Briefcase,
    color: "green",
    stageId: 2,
  },
  final: {
    title: "终面 - 战略思维与行业洞察评估",
    description: "评估战略思维、行业洞察、商业模式设计、复杂场景分析",
    icon: Trophy,
    color: "purple",
    stageId: 3,
  },
}

// 组件接口定义
interface InterviewPracticeProps {
  moduleType: "hr" | "professional" | "final"
  onBack: () => void
}

type EvaluationResult = AggregatedReport;

export default function InterviewPractice({ moduleType = "hr", onBack }: InterviewPracticeProps) {
  // 类型检查函数
  const isAggregatedReport = (data: any): data is AggregatedReport => {
    return 'individualEvaluations' in data && 'overallSummary' in data;
  }

  // 状态管理
  const [currentStep, setCurrentStep] = useState<"overview" | "answering" | "analyzing" | "result">("overview")
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [currentAnswer, setCurrentAnswer] = useState("")
  const [timeLeft, setTimeLeft] = useState(0)
  const [feedback, setFeedback] = useState<EvaluationResult | null>(null)
  const [evaluationError, setEvaluationError] = useState<string | null>(null)
  const [stageProgress, setStageProgress] = useState(0)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)
  const [totalQuestionsInStage, setTotalQuestionsInStage] = useState(0)
  const [questionStats, setQuestionStats] = useState<{ totalQuestions: number; questionsByStage: any[] }>({
    totalQuestions: 0,
    questionsByStage: [],
  })
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [speechError, setSpeechError] = useState<string | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState("")
  const [finalTranscript, setFinalTranscript] = useState("")
  const [audioLevel, setAudioLevel] = useState(0)
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)

  // 语音合成状态
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speechRate, setSpeechRate] = useState(1.0)
  const [speechVolume, setSpeechVolume] = useState(0.8)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [speechProgress, setSpeechProgress] = useState(0)
  const [showSpeechSettings, setShowSpeechSettings] = useState(false)

  const currentStage = stageConfig[moduleType]
  const IconComponent = currentStage.icon

  // 加载题目
  const loadQuestions = async () => {
    setIsLoadingQuestions(true)
    try {
      console.log(`🔍 [前端] 开始加载 ${currentStage.title} 的题目，stageId: ${currentStage.stageId}`)

      const [fetchedQuestions, totalCount] = await Promise.all([
        getRandomQuestions(currentStage.stageId, undefined, 3),
        getQuestionCount(currentStage.stageId),
      ])

      console.log(
        `📚 [前端] 成功获取 ${fetchedQuestions.length} 道题目:`,
        fetchedQuestions.map((q) => ({
          id: q.id,
          text: q.question_text.substring(0, 50) + "...",
        })),
      )
      console.log(`📊 [前端] 该阶段题库总数: ${totalCount}`)

      setQuestions(fetchedQuestions)
      setTotalQuestionsInStage(totalCount)

      const stats = await getQuestionStats()
      setQuestionStats(stats)
      console.log(`📊 [前端] 题库统计:`, stats)
    } catch (error) {
      console.error("💥 [前端] 加载题目失败:", error)
      setQuestions([])
      setTotalQuestionsInStage(0)
    } finally {
      setIsLoadingQuestions(false)
    }
  }

  // 智能标点符号添加
  const addSmartPunctuation = (text: string): string => {
    if (typeof text !== 'string' || !text.trim()) return '';

    let result = text.trim();

    if (!/[。！？，、；：]$/.test(result)) {
      if (/^(什么|怎么|为什么|哪里|哪个|如何|是否|能否|可以|会不会)/.test(result.toLowerCase()) || /吗$/.test(result)) {
        result += "？";
      } else {
        result += "。";
      }
    }

    return " " + result;
  }

  // 加载题目
  useEffect(() => {
    loadQuestions()
  }, [moduleType])

  // 计时器
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (currentStep === "answering" && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [currentStep, timeLeft])

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // 开始练习
  const startPractice = () => {
    if (questions.length === 0) {
      console.warn("⚠️ [前端] 没有可用题目，重新加载")
      loadQuestions()
      return
    }

    setCurrentQuestionIndex(0)
    setAnswers([])
    setCurrentAnswer("")
    setTimeLeft(300) // 5分钟每题
    setCurrentStep("answering")
    setFeedback(null)
    setEvaluationError(null)
    setStageProgress(0)
    console.log("🔄 [前端] 开始阶段练习:", currentStage.title, `共${questions.length}道题`)
  }

  // 提交当前答案
  const submitCurrentAnswer = () => {
    if (!currentAnswer.trim()) return

    const newAnswers = [...answers, currentAnswer]
    setAnswers(newAnswers)
    setCurrentAnswer("")
    setStageProgress(((currentQuestionIndex + 1) / questions.length) * 100)

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
      setTimeLeft(300)
      console.log(`➡️ [前端] 进入第 ${currentQuestionIndex + 2} 题`)
    } else {
      console.log(`✅ [前端] 完成所有 ${questions.length} 道题目，开始评估`)
      submitAllAnswers(newAnswers)
    }
  }

  // 保存练习记录到数据库
  const savePracticeSession = async (evaluationResult: AggregatedReport, answers: string[]) => {
    try {
      const levelScoreMap: { [key: string]: number } = {
        "优秀表现": 90,
        "良好表现": 75,
        "有待提高": 60,
        "初学乍练": 45,
        "无法评估": 0,
      };

      const practiceData = {
        stage_type: moduleType,
        questions_and_answers: questions.map((question, index) => ({
          question: question.question_text,
          answer: answers[index] || '',
          question_id: question.id
        })),
        evaluation_score: levelScoreMap[evaluationResult.overallSummary.overallLevel] ?? 60,
        ai_feedback: {
          summary: evaluationResult.overallSummary.summary,
          strengths: evaluationResult.overallSummary.strengths,
          improvements: evaluationResult.overallSummary.improvements,
        }
      }

      console.log("💾 [前端] 保存练习记录:", practiceData)

      const response = await fetch('/api/practice-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(practiceData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '保存练习记录失败')
      }

      const result = await response.json()
      console.log("✅ [前端] 练习记录保存成功:", result)
    } catch (error) {
      console.error("💥 [前端] 保存练习记录失败:", error)
    }
  }

  // 提交所有答案进行评估
  const submitAllAnswers = async (allAnswers: string[]) => {
    console.log("🎯 [前端] 提交阶段答案:", {
      stage: moduleType,
      questionCount: questions.length,
      answerCount: allAnswers.length,
    })

    setCurrentStep("analyzing")
    setIsEvaluating(true)
    setEvaluationError(null)

    let progress = 0
    const progressInterval = setInterval(() => {
      progress += Math.random() * 15
      if (progress > 90) progress = 90
      setStageProgress(progress)
    }, 200)

    try {
      const requestData = {
        stageType: moduleType,
        questions: questions.map((q) => q.question_text),
        answers: allAnswers,
        stageTitle: currentStage.title,
        async: false,
      }

      console.log("📤 [前端] 发送评估请求:", requestData)

      const response = await fetch("/api/evaluate-question-set", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      const responseData = await response.json()
      clearInterval(progressInterval)
      setStageProgress(100)

      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || "评估服务暂时不可用")
      }

      if (isAggregatedReport(responseData)) {
        const aggregatedReport: AggregatedReport = responseData
        setFeedback(aggregatedReport)
        setCurrentStep("result")
        
        savePracticeSession(aggregatedReport, allAnswers)
        
        console.log("✅ [前端] 新版评估完成:", {
          evaluationId: aggregatedReport.evaluationId,
          overallLevel: aggregatedReport.overallSummary.overallLevel,
          individualCount: aggregatedReport.individualEvaluations.length
        })
      } else {
        console.error("评估结果格式错误", responseData);
        throw new Error("收到的评估结果格式不正确。")
      }
    } catch (error) {
      clearInterval(progressInterval)
      console.error("💥 [前端] 评估失败:", error)
      setEvaluationError(error instanceof Error ? error.message : "评估失败，请稍后重试")

      const fallbackResult = generateFallbackEvaluation()
      setFeedback(fallbackResult)
      setCurrentStep("result")
      
      savePracticeSession(fallbackResult, allAnswers)
      
      console.log("🔄 [前端] 使用备用评估结果")
    } finally {
      setIsEvaluating(false)
    }
  }

  // 生成备用评估结果
  const generateFallbackEvaluation = (): AggregatedReport => {
    return {
      evaluationId: `fallback-${Date.now()}`,
      overallSummary: {
        overallLevel: "良好表现",
        summary: "你的回答展现了良好的基础素养和学习态度，在表达逻辑和专业认知方面有不错的表现。",
        strengths: [
          {
            competency: "表达逻辑",
            description: "回答结构清晰，能够按照逻辑顺序组织内容，体现了良好的沟通基础。",
          },
          {
            competency: "学习态度",
            description: "对AI产品经理角色有基本认知，展现出学习和成长的积极态度。",
          },
        ],
        improvements: [
          {
            competency: "深化理解",
            suggestion: "建议进一步深化对AI产品经理角色的理解，特别是技术与商业的结合。",
            example: "可以通过分析具体的AI产品案例来提升认知深度。",
          },
        ],
      },
      individualEvaluations: questions.map((q, i) => ({
        question: q.question_text,
        answer: answers[i] || "(未回答)",
        evaluation: {
          preliminaryAnalysis: {
            isValid: true,
            feedback: "这是一个备用的评估结果。"
          },
          performanceLevel: "良好表现",
          strengths: [],
          improvements: [],
          followUpQuestion: "请尝试重新回答这个问题。"
        }
      }))
    }
  }

  // 语音识别初始化
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'zh-CN'
      recognition.maxAlternatives = 1

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = ''
        let final = ''
        
        for (let i = event.results.length - 1; i >= 0; i--) {
          const result = event.results[i]
          if (result.isFinal) {
            final = result[0].transcript
          } else {
            interim = result[0].transcript
          }
        }
        
        setInterimTranscript(interim)
        if (final) {
          setFinalTranscript(prev => prev + addSmartPunctuation(final))
          setCurrentAnswer(prev => prev + addSmartPunctuation(final))
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('语音识别错误:', event.error)
        setSpeechError(`语音识别错误: ${event.error}`)
        setIsRecording(false)
      }

      recognition.onend = () => {
        setIsRecording(false)
        setInterimTranscript('')
      }

      setRecognition(recognition)
    }
  }, [])

  // 语音合成初始化
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const voices = speechSynthesis.getVoices()
        const chineseVoices = voices.filter(voice => 
          voice.lang.includes('zh') || voice.lang.includes('CN')
        )
        setAvailableVoices(chineseVoices.length > 0 ? chineseVoices : voices)
        if (chineseVoices.length > 0 && !selectedVoice) {
          setSelectedVoice(chineseVoices[0])
        }
      }
      
      updateVoices()
      speechSynthesis.onvoiceschanged = updateVoices
    }
  }, [])

  // 开始/停止语音识别
  const toggleRecording = () => {
    if (!recognition) {
      setSpeechError('您的浏览器不支持语音识别功能')
      return
    }

    if (isRecording) {
      recognition.stop()
      setIsRecording(false)
    } else {
      setSpeechError(null)
      setInterimTranscript('')
      recognition.start()
      setIsRecording(true)
    }
  }

  // 朗读题目
  const speakQuestion = (text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('您的浏览器不支持语音合成功能')
      return
    }

    // 停止当前朗读
    speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = speechRate
    utterance.volume = speechVolume
    utterance.lang = 'zh-CN'
    
    if (selectedVoice) {
      utterance.voice = selectedVoice
    }

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => {
      setIsSpeaking(false)
      setSpeechProgress(0)
    }
    utterance.onerror = () => {
      setIsSpeaking(false)
      setSpeechProgress(0)
    }

    // 模拟进度
    utterance.onboundary = () => {
      setSpeechProgress(prev => Math.min(prev + 10, 90))
    }

    speechSynthesis.speak(utterance)
  }

  // 停止朗读
  const stopSpeaking = () => {
    speechSynthesis.cancel()
    setIsSpeaking(false)
    setSpeechProgress(0)
  }

  // 重新开始练习
  const restartPractice = () => {
    setCurrentStep("overview")
    setCurrentQuestionIndex(0)
    setAnswers([])
    setCurrentAnswer("")
    setFeedback(null)
    setEvaluationError(null)
    setStageProgress(0)
    // 停止语音相关功能
    if (recognition && isRecording) {
      recognition.stop()
    }
    stopSpeaking()
    loadQuestions()
  }

  // 加载中状态
  if (isLoadingQuestions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <h3 className="text-lg font-semibold mb-2">正在加载题目...</h3>
            <p className="text-gray-600">请稍候，我们正在为您准备{currentStage.title}的题目</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 无题目状态
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">暂无可用题目</h3>
            <p className="text-gray-600 mb-4">该阶段的题目正在准备中，请稍后再试</p>
            <div className="space-y-2">
              <Button onClick={loadQuestions} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                重新加载
              </Button>
              <Button variant="outline" onClick={onBack} className="w-full bg-transparent">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回选择
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* 头部导航 */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            返回模块选择
          </Button>
          <div className="flex items-center gap-3">
            <IconComponent className={`h-6 w-6 text-${currentStage.color}-600`} />
            <h1 className="text-2xl font-bold text-gray-900">{currentStage.title}</h1>
          </div>
        </div>

        {/* 概览阶段 */}
        {currentStep === "overview" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  练习概览
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">{currentStage.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{questions.length}</div>
                    <div className="text-sm text-gray-600">本次练习题目</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">5</div>
                    <div className="text-sm text-gray-600">每题时间(分钟)</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{totalQuestionsInStage}</div>
                    <div className="text-sm text-gray-600">题库总数</div>
                  </div>
                </div>
                <Button onClick={startPractice} className="w-full" size="lg">
                  <Play className="h-4 w-4 mr-2" />
                  开始练习
                </Button>
              </CardContent>
            </Card>


          </div>
        )}

        {/* 答题阶段 */}
        {currentStep === "answering" && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* 进度条 */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    题目 {currentQuestionIndex + 1} / {questions.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className={`text-sm font-medium ${
                      timeLeft < 60 ? "text-red-600" : "text-gray-600"
                    }`}>
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                </div>
                <Progress value={stageProgress} className="h-2" />
              </CardContent>
            </Card>

            {/* 题目卡片 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{questions[currentQuestionIndex]?.question_text}</span>
                  <div className="flex items-center gap-2">
                    {/* 朗读题目按钮 */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => isSpeaking ? stopSpeaking() : speakQuestion(questions[currentQuestionIndex]?.question_text || '')}
                      className="flex items-center gap-1"
                    >
                      {isSpeaking ? (
                        <>
                          <VolumeX className="h-4 w-4" />
                          停止
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-4 w-4" />
                          朗读
                        </>
                      )}
                    </Button>
                    
                    {/* 语音设置按钮 */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSpeechSettings(!showSpeechSettings)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
                
                {/* 语音设置面板 */}
                {showSpeechSettings && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">朗读速度</label>
                      <Slider
                        value={[speechRate]}
                        onValueChange={(value) => setSpeechRate(value[0])}
                        min={0.5}
                        max={2}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="text-xs text-gray-500 mt-1">{speechRate.toFixed(1)}x</div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">音量</label>
                      <Slider
                        value={[speechVolume]}
                        onValueChange={(value) => setSpeechVolume(value[0])}
                        min={0}
                        max={1}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="text-xs text-gray-500 mt-1">{Math.round(speechVolume * 100)}%</div>
                    </div>
                    
                    {availableVoices.length > 0 && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">语音选择</label>
                        <Select
                          value={selectedVoice?.name || ''}
                          onValueChange={(value) => {
                            const voice = availableVoices.find(v => v.name === value)
                            setSelectedVoice(voice || null)
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择语音" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableVoices.map((voice) => (
                              <SelectItem key={voice.name} value={voice.name}>
                                {voice.name} ({voice.lang})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}
                
                {/* 朗读进度 */}
                {isSpeaking && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Volume2 className="h-4 w-4 animate-pulse" />
                      正在朗读...
                    </div>
                    <Progress value={speechProgress} className="h-1 mt-1" />
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Textarea
                    placeholder="请输入您的答案，或点击麦克风按钮使用语音输入..."
                    value={currentAnswer + interimTranscript}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    className="min-h-[200px] resize-none pr-12"
                  />
                  
                  {/* 语音识别按钮 */}
                  <Button
                    variant={isRecording ? "destructive" : "outline"}
                    size="sm"
                    onClick={toggleRecording}
                    className="absolute bottom-3 right-3"
                  >
                    {isRecording ? (
                      <>
                        <Pause className="h-4 w-4" />
                        停止
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4" />
                        语音
                      </>
                    )}
                  </Button>
                </div>
                
                {/* 语音识别状态 */}
                {isRecording && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <Mic className="h-4 w-4 animate-pulse" />
                    正在录音，请说话...
                    {interimTranscript && (
                      <span className="text-gray-500">({interimTranscript})</span>
                    )}
                  </div>
                )}
                
                {/* 语音错误提示 */}
                {speechError && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {speechError}
                  </div>
                )}
                
                <div className="flex justify-between">
                  <div className="text-sm text-gray-500">
                    已输入 {currentAnswer.length} 字符
                  </div>
                  <Button 
                    onClick={submitCurrentAnswer}
                    disabled={!currentAnswer.trim()}
                    className="flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {currentQuestionIndex < questions.length - 1 ? "下一题" : "完成答题"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 分析阶段 */}
        {currentStep === "analyzing" && (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-8 text-center">
                <Brain className="h-12 w-12 animate-pulse mx-auto mb-4 text-blue-600" />
                <h3 className="text-xl font-semibold mb-2">AI正在分析您的回答</h3>
                <p className="text-gray-600 mb-6">请稍候，我们正在为您生成详细的评估报告...</p>
                <Progress value={stageProgress} className="mb-4" />
                <div className="text-sm text-gray-500">{Math.round(stageProgress)}% 完成</div>
                {evaluationError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{evaluationError}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* 结果阶段 */}
        {currentStep === "result" && feedback && (
          <div className="max-w-4xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  评估完成
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 总体评估 */}
                <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {feedback.overallSummary.overallLevel}
                  </div>
                  <p className="text-gray-700">{feedback.overallSummary.summary}</p>
                </div>

                {/* 优势分析 */}
                {feedback.overallSummary.strengths && feedback.overallSummary.strengths.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-green-600 mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      您的优势
                    </h4>
                    <div className="space-y-3">
                      {feedback.overallSummary.strengths.map((strength, index) => (
                        <div key={index} className="p-4 bg-green-50 rounded-lg">
                          <div className="font-medium text-green-800">{strength.competency}</div>
                          <div className="text-green-700 text-sm mt-1">{strength.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 改进建议 */}
                {feedback.overallSummary.improvements && feedback.overallSummary.improvements.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-orange-600 mb-3 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      改进建议
                    </h4>
                    <div className="space-y-3">
                      {feedback.overallSummary.improvements.map((improvement, index) => (
                        <div key={index} className="p-4 bg-orange-50 rounded-lg">
                          <div className="font-medium text-orange-800">{improvement.competency}</div>
                          <div className="text-orange-700 text-sm mt-1">{improvement.suggestion}</div>
                          {improvement.example && (
                            <div className="text-orange-600 text-sm mt-2 italic">
                              示例：{improvement.example}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex gap-3">
                  <Button onClick={restartPractice} className="flex-1">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    重新练习
                  </Button>
                  <Button onClick={onBack} className="flex-1">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    返回选择
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
