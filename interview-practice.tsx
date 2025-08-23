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
import { QuickTips } from "@/components/quick-tips"
import type { AggregatedReport, IndividualEvaluationResponse } from "@/types/evaluation"
import { getHistoryFeedbackNextSteps } from './lib/qualitative-analytics';

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
    onresult: (event: SpeechRecognitionEvent) => void
    onerror: (event: SpeechRecognitionErrorEvent) => void
    onend: () => void
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

  // 检查是否为旧版评估格式
  const isLegacyEvaluation = (data: any): boolean => {
    return data && 'encouragement' in data;
  }

  // 获取历史反馈的等级
  const getHistoryFeedbackLevel = (feedback: EvaluationResult): string => {
    return feedback.overallSummary.overallLevel || '良好表现';
  }

  // 获取历史反馈的总结
  const getHistoryFeedbackSummary = (feedback: EvaluationResult): string => {
    return feedback.overallSummary.summary || '暂无评估总结';
  }

  // 获取历史反馈的优势
  const getHistoryFeedbackStrengths = (feedback: EvaluationResult) => {
    return feedback.overallSummary.strengths || [];
  }

  // 获取历史反馈的改进建议
  const getHistoryFeedbackImprovements = (feedback: EvaluationResult) => {
    return feedback.overallSummary.improvements || [];
  }
  // 状态管理
  const [currentStep, setCurrentStep] = useState<"overview" | "answering" | "analyzing" | "result">("overview")
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [currentAnswer, setCurrentAnswer] = useState("")
  const [timeLeft, setTimeLeft] = useState(0)
  const [feedback, setFeedback] = useState<EvaluationResult | null>(null)
  const [history, setHistory] = useState<EvaluationResult[]>([])
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

  // 语音识别初始化
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log("🎤 检查语音识别支持...")
      const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition

      if (SpeechRecognitionConstructor) {
        console.log("✅ 浏览器支持语音识别")
        try {
          const recog = new SpeechRecognitionConstructor() as SpeechRecognition
          // 优化配置
          recog.continuous = true // 启用连续识别
          recog.interimResults = true // 启用中间结果
          recog.lang = "zh-CN"
          recog.maxAlternatives = 1 // 只返回最佳结果

          recog.onstart = () => {
            console.log("🎤 语音识别已启动")
            setIsRecording(true)
            setSpeechError(null)
          }

          recog.onresult = (event: SpeechRecognitionEvent) => {
            console.log("🎤 收到语音识别结果:", event.results)

            let interim = ""
            let final = ""

            // 处理所有结果
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript

              if (event.results[i].isFinal) {
                // 处理最终结果，添加智能标点
                final += addSmartPunctuation(transcript)
                console.log("🎤 最终识别文本:", final)
              } else {
                // 处理中间结果
                interim += transcript
              }
            }

            setInterimTranscript(interim)

            if (final) {
              setFinalTranscript((prev) => prev + final)
              setCurrentAnswer((prev) => {
                const newAnswer = prev + final
                return newAnswer
              })

              // 清空中间结果
              setInterimTranscript("")
            }
          }

          recog.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error("🎤 语音识别错误:", event.error, event)

            // 根据错误类型提供不同的提示
            let errorMessage = "语音识别出现问题"
            let shouldRestart = false

            switch (event.error) {
              case "network":
                errorMessage = "网络连接问题，语音识别需要网络支持。请检查网络连接。"
                shouldRestart = true
                break
              case "not-allowed":
                errorMessage = "请允许麦克风权限以使用语音输入。点击浏览器地址栏的麦克风图标允许权限。"
                setIsRecording(false)
                break
              case "no-speech":
                errorMessage = "未检测到语音，继续监听中..."
                shouldRestart = true
                break
              case "audio-capture":
                errorMessage = "麦克风无法访问，请检查设备连接"
                setIsRecording(false)
                break
              case "service-not-allowed":
                errorMessage = "语音识别服务不可用，请使用键盘输入"
                setIsRecording(false)
                break
              case "aborted":
                // 用户主动停止，不显示错误
                return
              default:
                errorMessage = `语音识别错误: ${event.error}`
                setIsRecording(false)
            }

            setSpeechError(errorMessage)

            // 对于某些错误，尝试自动重启
            if (shouldRestart && isRecording && !isPaused) {
              setTimeout(() => {
                try {
                  recog.start()
                  setSpeechError(null)
                } catch (restartError) {
                  console.error("❌ 自动重启失败:", restartError)
                }
              }, 1000)
            } else {
              // 3秒后清除错误信息（除非是权限错误）
              if (event.error !== "not-allowed") {
                setTimeout(() => setSpeechError(null), 3000)
              }
            }
          }

          recog.onend = () => {
            console.log("🎤 语音识别已结束")

            // 如果还在录音状态且未暂停，自动重启
            if (isRecording && !isPaused) {
              console.log("🎤 自动重启语音识别...")
              setTimeout(() => {
                try {
                  recog.start()
                } catch (error) {
                  console.error("❌ 自动重启失败:", error)
                  setIsRecording(false)
                }
              }, 100)
            } else {
              setIsRecording(false)
            }
          }

          setRecognition(recog)
          console.log("✅ 语音识别初始化完成")
        } catch (error) {
          console.error("❌ 语音识别初始化失败:", error)
          setSpeechError("语音识别初始化失败，请使用键盘输入")
        }
      } else {
        console.warn("❌ 浏览器不支持语音识别")
        setSpeechError("当前浏览器不支持语音识别，请使用键盘输入")
      }
    }
  }, [])

  // 语音合成初始化
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      console.log("🔊 初始化语音合成...")

      // 获取可用语音列表
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices()
        console.log(
          "🔊 可用语音:",
          voices.map((v) => ({ name: v.name, lang: v.lang })),
        )

        // 筛选中文语音
        const chineseVoices = voices.filter((voice) => voice.lang.includes("zh") || voice.lang.includes("CN"))

        setAvailableVoices(chineseVoices.length > 0 ? chineseVoices : voices)

        // 自动选择最佳中文语音
        const bestVoice =
          chineseVoices.find((voice) => voice.name.includes("Microsoft") || voice.name.includes("Google")) ||
          chineseVoices[0] ||
          voices[0]

        if (bestVoice) {
          setSelectedVoice(bestVoice)
          console.log("🔊 选择语音:", bestVoice.name)
        }
      }

      // 语音列表可能需要异步加载
      if (window.speechSynthesis.getVoices().length > 0) {
        loadVoices()
      } else {
        window.speechSynthesis.onvoiceschanged = loadVoices
      }
    } else {
      console.warn("❌ 浏览器不支持语音合成")
    }
  }, [])

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

  // 加载题目和历史记录
  useEffect(() => {
    loadQuestions()
    const savedHistory = localStorage.getItem(`interviewHistory_${moduleType}`)
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
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
          // nextSteps and encouragement are not in the new model, so we remove them
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
      // Do not re-throw, as this is a non-critical background task
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
        const newHistory = [...history, aggregatedReport]
        setHistory(newHistory)
        localStorage.setItem(`interviewHistory_${moduleType}`, JSON.stringify(newHistory))
        
        // 保存练习记录到数据库 (fire and forget)
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
      const newHistory = [...history, fallbackResult]
      setHistory(newHistory)
      localStorage.setItem(`interviewHistory_${moduleType}`, JSON.stringify(newHistory))
      
      // 保存备用评估结果到数据库
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

  // 语音识别控制
  const toggleRecording = async () => {
    if (!recognition) {
      setSpeechError("语音识别未初始化，请刷新页面重试")
      return
    }

    if (isRecording) {
      console.log("🎤 停止语音识别")
      setIsRecording(false)
      setIsPaused(false)
      recognition.stop()
      stopAudioLevelMonitoring()
      return
    }

    // 启动语音识别前的检查
    setSpeechError(null)
    setIsPaused(false)
    setInterimTranscript("")
    setFinalTranscript("")
    console.log("🎤 准备启动语音识别...")

    try {
      // 检查麦克风权限
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          console.log("🎤 检查麦克风权限...")
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          console.log("✅ 麦克风权限已获取")
          // 立即停止流，我们只是检查权限
          stream.getTracks().forEach((track) => track.stop())
        } catch (permissionError) {
          console.error("❌ 麦克风权限被拒绝:", permissionError)
          setSpeechError('请允许麦克风权限。点击浏览器地址栏的麦克风图标，选择"允许"。')
          return
        }
      }

      console.log("🎤 启动语音识别...")
      recognition.start()
      setIsRecording(true)
      startAudioLevelMonitoring()
      console.log("✅ 语音识别启动成功")
    } catch (error) {
      console.error("❌ 启动语音识别失败:", error)
      setIsRecording(false)

      if (error.name === "InvalidStateError") {
        setSpeechError("语音识别正在运行中，请稍后再试")
      } else if (error.name === "NotAllowedError") {
        setSpeechError("麦克风权限被拒绝，请在浏览器设置中允许麦克风访问")
      } else {
        setSpeechError("无法启动语音识别，请检查麦克风设备或使用键盘输入")
      }
    }
  }

  // 暂停/恢复语音识别
  const togglePause = () => {
    if (!recognition || !isRecording) return

    if (isPaused) {
      console.log("🎤 恢复语音识别")
      setIsPaused(false)
      try {
        recognition.start()
        startAudioLevelMonitoring()
      } catch (error) {
        console.error("❌ 恢复语音识别失败:", error)
      }
    } else {
      console.log("🎤 暂停语音识别")
      setIsPaused(true)
      recognition.stop()
      stopAudioLevelMonitoring()
    }
  }

  // 开始音量监测
  const startAudioLevelMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const context = new AudioContext()
      const analyserNode = context.createAnalyser()
      const source = context.createMediaStreamSource(stream)

      analyserNode.fftSize = 256
      source.connect(analyserNode)

      setAudioContext(context)
      setAnalyser(analyserNode)

      const dataArray = new Uint8Array(analyserNode.frequencyBinCount)

      const updateAudioLevel = () => {
        if (analyserNode) {
          analyserNode.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
          const level = Math.round((average / 255) * 100)
          setAudioLevel(level)

          if (isRecording && !isPaused) {
            requestAnimationFrame(updateAudioLevel)
          }
        }
      }

      updateAudioLevel()
    } catch (error) {
      console.error("❌ 音量监测启动失败:", error)
    }
  }

  // 停止音量监测
  const stopAudioLevelMonitoring = () => {
    if (audioContext) {
      audioContext.close()
      setAudioContext(null)
      setAnalyser(null)
      setAudioLevel(0)
    }
  }

  // 朗读题目
  const speakQuestion = () => {
    if (!window.speechSynthesis || !selectedVoice || !questions[currentQuestionIndex]) {
      console.warn("❌ 语音合成不可用")
      return
    }

    // 停止当前朗读
    window.speechSynthesis.cancel()

    const questionText = questions[currentQuestionIndex].question_text
    console.log("🔊 开始朗读题目:", questionText)

    const utterance = new SpeechSynthesisUtterance(questionText)
    utterance.voice = selectedVoice
    utterance.rate = speechRate
    utterance.volume = speechVolume
    utterance.lang = "zh-CN"

    utterance.onstart = () => {
      console.log("🔊 朗读开始")
      setIsSpeaking(true)
      setSpeechProgress(0)
    }

    utterance.onend = () => {
      console.log("🔊 朗读结束")
      setIsSpeaking(false)
      setSpeechProgress(100)

      // 朗读完成后聚焦到答案输入框
      setTimeout(() => {
        const textarea = document.querySelector('textarea[placeholder*="请输入"]') as HTMLTextAreaElement
        if (textarea) {
          textarea.focus()
        }
      }, 500)
    }

    utterance.onerror = (event) => {
      console.error("🔊 朗读错误:", event.error)
      setIsSpeaking(false)
      setSpeechProgress(0)
    }

    // 模拟朗读进度
    utterance.onboundary = (event) => {
      if (event.name === "word") {
        const progress = Math.min((event.charIndex / questionText.length) * 100, 95)
        setSpeechProgress(progress)
      }
    }

    window.speechSynthesis.speak(utterance)
  }

  // 停止朗读
  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      console.log("🔊 停止朗读")
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      setSpeechProgress(0)
    }
  }

  // 暂停/恢复朗读
  const toggleSpeaking = () => {
    if (!window.speechSynthesis) return

    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      console.log("🔊 暂停朗读")
      window.speechSynthesis.pause()
    } else if (window.speechSynthesis.paused) {
      console.log("🔊 恢复朗读")
      window.speechSynthesis.resume()
    } else {
      speakQuestion()
    }
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
    loadQuestions()
  }

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 只在答题阶段响应快捷键
      if (currentStep !== "answering") return

      // 检查是否在输入框中
      const target = event.target as HTMLElement
      if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") return

      // Ctrl/Cmd + R: 朗读题目
      if ((event.ctrlKey || event.metaKey) && event.key === "r") {
        event.preventDefault()
        speakQuestion()
      }

      // Ctrl/Cmd + P: 暂停/恢复朗读
      if ((event.ctrlKey || event.metaKey) && event.key === "p") {
        event.preventDefault()
        if (isSpeaking) {
          toggleSpeaking()
        }
      }

      // Ctrl/Cmd + S: 停止朗读
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault()
        if (isSpeaking) {
          stopSpeaking()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [currentStep, isSpeaking])

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
            <QuickTips stage={moduleType as "hr" | "professional" | "final"} />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  练习概览
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">本轮评估重点</h3>
                    <p className="text-gray-600 mb-4">{currentStage.description}</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">每题限时5分钟</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-green-600" />
                        <span className="text-sm">共{questions.length}道精选题目</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mic className="h-4 w-4 text-purple-600" />
                        <span className="text-sm">支持语音输入</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">题库统计</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">本阶段题目总数</span>
                        <Badge variant="secondary">{totalQuestionsInStage}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">全库题目总数</span>
                        <Badge variant="secondary">{questionStats.totalQuestions}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t">
                  <Button onClick={startPractice} size="lg" className="w-full">
                    <Play className="h-4 w-4 mr-2" />
                    开始练习
                  </Button>
                </div>
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
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-mono">{formatTime(timeLeft)}</span>
                  </div>
                </div>
                <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} />
              </CardContent>
            </Card>

            {/* 题目卡片 */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-lg flex-1">{questions[currentQuestionIndex]?.question_text}</CardTitle>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={isSpeaking ? stopSpeaking : speakQuestion}
                      className={isSpeaking ? "bg-blue-50 border-blue-200" : ""}
                    >
                      {isSpeaking ? <VolumeX className="h-4 w-4 mr-1" /> : <Volume2 className="h-4 w-4 mr-1" />}
                      {isSpeaking ? "停止朗读" : "朗读题目"}
                    </Button>

                    {isSpeaking && (
                      <Button variant="outline" size="sm" onClick={toggleSpeaking}>
                        <Pause className="h-4 w-4 mr-1" />
                        暂停
                      </Button>
                    )}

                    <Button variant="outline" size="sm" onClick={speakQuestion} disabled={isSpeaking}>
                      <RotateCcw className="h-4 w-4 mr-1" />
                      重读
                    </Button>

                    <Button variant="outline" size="sm" onClick={() => setShowSpeechSettings(!showSpeechSettings)}>
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* 朗读进度指示器 */}
                {isSpeaking && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>朗读进度</span>
                      <span>{Math.round(speechProgress)}%</span>
                    </div>
                    <Progress value={speechProgress} className="h-1" />
                  </div>
                )}

                {/* 语音设置面板 */}
                {showSpeechSettings && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-2 mb-3">
                      <Settings className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">语音设置</span>
                    </div>

                    <div className="space-y-4">
                      {/* 语速调节 */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-medium text-gray-600">语速</label>
                          <span className="text-xs text-gray-500">{speechRate.toFixed(1)}x</span>
                        </div>
                        <Slider
                          value={[speechRate]}
                          onValueChange={(value) => setSpeechRate(value[0])}
                          min={0.5}
                          max={2.0}
                          step={0.1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>慢</span>
                          <span>快</span>
                        </div>
                      </div>

                      {/* 音量调节 */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-medium text-gray-600">音量</label>
                          <span className="text-xs text-gray-500">{Math.round(speechVolume * 100)}%</span>
                        </div>
                        <Slider
                          value={[speechVolume]}
                          onValueChange={(value) => setSpeechVolume(value[0])}
                          min={0.1}
                          max={1.0}
                          step={0.1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>小</span>
                          <span>大</span>
                        </div>
                      </div>

                      {/* 声音选择 */}
                      {availableVoices.length > 0 && (
                        <div>
                          <label className="text-xs font-medium text-gray-600 block mb-2">声音</label>
                          <Select
                            value={selectedVoice?.name || ""}
                            onValueChange={(value) => {
                              const voice = availableVoices.find((v) => v.name === value)
                              setSelectedVoice(voice || null)
                            }}
                          >
                            <SelectTrigger className="w-full text-xs">
                              <SelectValue placeholder="选择声音" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableVoices.map((voice) => (
                                <SelectItem key={voice.name} value={voice.name} className="text-xs">
                                  {voice.name} ({voice.lang})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* 测试按钮 */}
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (window.speechSynthesis) {
                              const utterance = new SpeechSynthesisUtterance("这是语音测试")
                              utterance.rate = speechRate
                              utterance.volume = speechVolume
                              if (selectedVoice) utterance.voice = selectedVoice
                              window.speechSynthesis.speak(utterance)
                            }
                          }}
                          className="w-full"
                        >
                          <Volume2 className="h-3 w-3 mr-1" />
                          测试语音
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="请输入您的答案..."
                  className="min-h-[200px]"
                />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={toggleRecording}
                        className={isRecording ? "bg-red-50 border-red-200" : ""}
                      >
                        <Mic className={`h-4 w-4 mr-2 ${isRecording ? "text-red-600" : ""}`} />
                        {isRecording ? "停止录音" : "语音输入"}
                      </Button>

                      {isRecording && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={togglePause}
                          className={isPaused ? "bg-yellow-50 border-yellow-200" : ""}
                        >
                          {isPaused ? "恢复" : "暂停"}
                        </Button>
                      )}
                    </div>

                    <Button onClick={submitCurrentAnswer} disabled={!currentAnswer.trim()}>
                      <Send className="h-4 w-4 mr-2" />
                      {currentQuestionIndex < questions.length - 1 ? "下一题" : "完成答题"}
                    </Button>
                  </div>

                  {/* 语音识别状态显示 */}
                  {isRecording && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`w-2 h-2 rounded-full ${isPaused ? "bg-yellow-500" : "bg-green-500 animate-pulse"}`}
                        ></div>
                        <span className="text-sm font-medium text-blue-700">
                          {isPaused ? "语音识别已暂停" : "正在监听..."}
                        </span>

                        {/* 音量指示器 */}
                        {!isPaused && (
                          <div className="flex items-center gap-1 ml-auto">
                            <span className="text-xs text-gray-500">音量:</span>
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-100"
                                style={{ width: `${Math.max(5, audioLevel)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500 w-8">{Math.round(audioLevel)}%</span>
                          </div>
                        )}
                      </div>

                      {interimTranscript && <p className="text-sm text-gray-600 italic">识别中: {interimTranscript}</p>}

                      {/* 音量提示 */}
                      {!isPaused && audioLevel < 10 && (
                        <p className="text-xs text-yellow-600 mt-1">💡 音量较低，请靠近麦克风或提高音量</p>
                      )}
                    </div>
                  )}

                  {speechError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-700 text-sm">{speechError}</p>
                    </div>
                  )}
                </div>

                {/* 快捷键提示 */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-1 mb-2">
                    <Settings className="h-3 w-3 text-gray-500" />
                    <span className="text-xs font-medium text-gray-600">快捷键</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <kbd className="px-1 py-0.5 bg-white border rounded text-xs">Ctrl+R</kbd>
                      <span>朗读</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="px-1 py-0.5 bg-white border rounded text-xs">Ctrl+P</kbd>
                      <span>暂停</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="px-1 py-0.5 bg-white border rounded text-xs">Ctrl+S</kbd>
                      <span>停止</span>
                    </div>
                  </div>
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
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
                <h3 className="text-xl font-semibold mb-2">AI正在分析您的回答</h3>
                <p className="text-gray-600 mb-6">请稍候，我们正在从多个维度评估您的表现...</p>
                <Progress value={stageProgress} className="mb-4" />
                <p className="text-sm text-gray-500">分析进度: {Math.round(stageProgress)}%</p>
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
              <CardContent>
                <div className="space-y-6">
                  {/* 总体表现 */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getHistoryFeedbackLevel(feedback) === "优秀表现" ? "default" : "secondary"}>
                        {getHistoryFeedbackLevel(feedback)}
                      </Badge>
                      {isAggregatedReport(feedback) && (
                        <Badge variant="outline" className="text-xs">
                          {feedback.questionCount}题套题
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-700">{getHistoryFeedbackSummary(feedback)}</p>
                  </div>

                  {/* 优势 */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Smile className="h-4 w-4 text-green-600" />
                      表现亮点
                    </h3>
                    <div className="space-y-3">
                      {getHistoryFeedbackStrengths(feedback).map((strength, index) => (
                        <div key={index} className="bg-green-50 p-4 rounded-lg">
                          <h4 className="font-medium text-green-800">{strength.area}</h4>
                          <p className="text-green-700 text-sm mt-1">{strength.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 改进建议 */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-orange-600" />
                      提升建议
                    </h3>
                    <div className="space-y-3">
                      {getHistoryFeedbackImprovements(feedback).map((improvement, index) => (
                        <div key={index} className="bg-orange-50 p-4 rounded-lg">
                          <h4 className="font-medium text-orange-800">{improvement.area}</h4>
                          <p className="text-orange-700 text-sm mt-1">{improvement.suggestion}</p>
                          {improvement.example && (
                            <p className="text-orange-600 text-xs mt-2 italic">{improvement.example}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 下一步行动 */}
                  {getHistoryFeedbackNextSteps(feedback).length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        行动计划
                      </h3>
                      <div className="space-y-3">
                        {getHistoryFeedbackNextSteps(feedback).map((step, index) => (
                          <div key={index} className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-medium text-blue-800">{step.action}</h4>
                            <p className="text-blue-700 text-sm mt-1">{step.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 鼓励话语 */}
                  {isLegacyEvaluation(feedback) && feedback.encouragement && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
                      <p className="text-purple-700 italic">{feedback.encouragement}</p>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t flex gap-4">
                  <Button onClick={restartPractice} variant="outline" className="flex-1 bg-transparent">
                    <RefreshCw className="h-4 w-4 mr-2" />
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
