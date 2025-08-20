import { type NextRequest, NextResponse } from "next/server"

const SILICONFLOW_API_URL = "https://api.siliconflow.cn/v1/chat/completions"
const SILICONFLOW_API_KEY = process.env.SILICONFLOW_API_KEY

interface EvaluationRequest {
  questionId: number
  question: string
  userAnswer: string
  keyPoints: string[]
  category: string
  difficulty: string
  stage?: string // Added stage parameter for three-stage evaluation
}

interface PenaltyResponse {
  isPenalty: true
  message: string
  reason: string
  suggestions: string[]
}

interface EvaluationResponse {
  overallScore: number
  coreCompetencyScores: {
    businessSensitivity: number
    userEmpathy: number
    technicalUnderstanding: number
    dataDrivern: number
    logicalThinking: number
  }
  rating: string
  interviewerReaction: string // Added interviewer's immediate reaction
  coreDiagnosis: string
  sentenceAnalysis: Array<{
    originalText: string
    problem: string
    optimizedText: string
  }>
  competencyRadar: {
    businessSensitivity: string
    userEmpathy: string
    technicalUnderstanding: string
    dataDrivern: string
    logicalThinking: string
  }
  deepDiveQuestion: string
  finalSummary: string
  howToAnswer: {
    openingPhrase: string
    keyStructure: string
    professionalPhrases: string[]
    avoidPhrases: string[]
  }
}

function buildEvaluationPrompt(data: EvaluationRequest): string {
  const stageConfig = getStageConfig(data.stage || "professional")

  return `你现在是一个真实的产品经理面试官，刚刚听完候选人的回答。

## 重要：你要像真人面试官一样反应
- 听到回答的第一反应是什么？直接说出来
- 不要像机器人一样分析，要像人一样感受
- 用最自然的话告诉候选人哪里有问题
- 就像坐在他们对面，直接对话

## 面试信息
问题：${data.question}
候选人回答：${data.userAnswer}

## 你的任务
像真实面试官一样，给出JSON格式的反馈：

{
  "overallScore": <1-100分>,
  "coreCompetencyScores": {
    "businessSensitivity": <1-10>,
    "userEmpathy": <1-10>,
    "technicalUnderstanding": <1-10>,
    "dataDrivern": <1-10>,
    "logicalThinking": <1-10>
  },
  "rating": "<优秀/良好/合格/待提升/需要重新准备>",
  "interviewerReaction": "<你听到这个回答的第一反应，10-15字，要自然！比如：'嗯...回答太短了'、'不错，思路清晰'、'你没说到重点啊'、'这个回答有点空'、'很好，很专业'、'你确定理解题目了吗？'>",
  "coreDiagnosis": "<直接说出最大的问题，不要绕弯子。比如：'你没有数据支撑'、'缺少具体案例'、'逻辑不清晰'、'没抓住核心问题'>",
  "sentenceAnalysis": [
    {
      "originalText": "<他说的原话>",
      "problem": "<这句话具体哪里不对，要直接>",
      "optimizedText": "<直接告诉他应该怎么说，给出具体的话>"
    }
  ],
  "competencyRadar": {
    "businessSensitivity": "<差/中/良/优>",
    "userEmpathy": "<差/中/良/优>", 
    "technicalUnderstanding": "<差/中/良/优>",
    "dataDrivern": "<差/中/良/优>",
    "logicalThinking": "<差/中/良/优>"
  },
  "deepDiveQuestion": "<针对他的回答，你会追问什么？>",
  "finalSummary": "<直接总结他的表现，不要用比喻，就说问题在哪里，怎么改进>",
  "howToAnswer": {
    "openingPhrase": "<具体的开场白，可以直接说出来的那种>",
    "keyStructure": "<回答框架，1234点那种，要具体>",
    "professionalPhrases": ["<3-5个可以直接用的专业说法>"],
    "avoidPhrases": ["<不要这么说，要具体指出哪些话不能说>"]
  }
}

## 关键要求：
1. 所有反馈都要直接，不要绕弯子
2. 问题诊断要具体，比如"缺少数据"而不是"表达不够充分"
3. 优化建议要可以直接复制使用
4. 不要用比喻和形容词，直接说问题
5. 告诉他具体应该加什么内容，删什么内容

${stageConfig.specificGuidance}

直接输出JSON，不要任何其他格式。`
}

function getStageConfig(stage: string) {
  switch (stage) {
    case "hr":
      return {
        stageName: "HR面试",
        specificGuidance: `
特别要求：
- 核心诊断必须直接指出：缺少职业规划、没有团队案例、动机不明确等具体问题
- 句子分析必须告诉他具体加什么词、删什么词
- 追问必须针对他回答中的空白点
- 总结直接说他哪里需要补充，不要用比喻`,
      }
    case "final":
      return {
        stageName: "终面",
        specificGuidance: `
特别要求：
- 核心诊断必须直接指出：缺少战略思维、没有行业洞察、格局不够等具体问题
- 句子分析必须提供高管级别的具体表达
- 追问必须考察他的认知盲区
- 总结直接说他的能力边界在哪里`,
      }
    default:
      return {
        stageName: "专业面试",
        specificGuidance: `
特别要求：
- 核心诊断必须直接指出：缺少产品思维、技术理解不足、没有用户视角等具体问题
- 句子分析必须告诉他产品经理应该怎么表达
- 追问必须针对他的专业能力空白
- 总结直接说他的专业水平和需要提升的具体方面`,
      }
  }
}

function cleanJsonResponse(content: string): string {
  console.log("🔧 [JSON清理] 开始清理AI响应")

  // Remove markdown code blocks and language identifiers
  let cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "")

  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim()

  // Remove any text before the first { and after the last }
  const firstBrace = cleaned.indexOf("{")
  const lastBrace = cleaned.lastIndexOf("}")

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1)
  }

  // Fix common JSON formatting issues
  cleaned = cleaned
    // Remove any trailing commas before closing braces/brackets
    .replace(/,(\s*[}\]])/g, "$1")
    // Fix unescaped quotes in strings
    .replace(/([^\\])"/g, '$1\\"')
    // Fix the previous replacement if it affected JSON structure
    .replace(/\\"/g, '"')
    // Ensure proper spacing around colons and commas
    .replace(/:\s*/g, ": ")
    .replace(/,\s*/g, ", ")
    // Remove any control characters that might cause parsing issues
    .replace(/[\x00-\x1F\x7F]/g, "")
    // Fix any double quotes that got mangled
    .replace(/"{2,}/g, '"')

  console.log("✨ [JSON清理] 清理完成，长度:", cleaned.length)

  // Validate basic JSON structure
  const openBraces = (cleaned.match(/{/g) || []).length
  const closeBraces = (cleaned.match(/}/g) || []).length

  if (openBraces !== closeBraces) {
    console.warn("⚠️ [JSON清理] 大括号不匹配:", { openBraces, closeBraces })
  }

  return cleaned
}

function detectLowQualityAnswer(userAnswer: string, question: string): PenaltyResponse | null {
  const answer = userAnswer.trim().toLowerCase()
  const questionWords = question
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 3)

  // Check for empty or too short answers
  if (answer.length < 10) {
    return {
      isPenalty: true,
      message: "请认真作答再继续解析",
      reason: "回答内容过于简短，无法进行有效评估",
      suggestions: ["请提供至少50字以上的详细回答", "结合具体案例或经验来阐述你的观点", "展示你的思考过程和分析逻辑"],
    }
  }

  // Check for random/nonsensical content
  const randomPatterns = [
    /^[a-z\s]*$/i, // Only letters and spaces (likely random typing)
    /(.)\1{4,}/, // Repeated characters (aaaaa, 11111)
    /^[0-9\s]*$/, // Only numbers and spaces
    /^[^\u4e00-\u9fa5a-zA-Z]*$/, // No Chinese or English characters
  ]

  for (const pattern of randomPatterns) {
    if (pattern.test(answer) && answer.length < 50) {
      return {
        isPenalty: true,
        message: "请认真作答再继续解析",
        reason: "检测到无意义的随机输入",
        suggestions: ["请用中文或英文认真回答问题", "避免输入无关的字符或数字", "展示你对问题的真实理解和思考"],
      }
    }
  }

  // Check for completely irrelevant answers
  const commonIrrelevantPhrases = [
    "不知道",
    "不清楚",
    "没想过",
    "随便",
    "无所谓",
    "都行",
    "看情况",
    "i don't know",
    "no idea",
    "whatever",
    "anything",
    "doesn't matter",
  ]

  const hasRelevantContent = questionWords.some(
    (word) => answer.includes(word) || answer.includes(word.substring(0, 3)),
  )

  const isIrrelevant =
    commonIrrelevantPhrases.some((phrase) => answer.includes(phrase)) && !hasRelevantContent && answer.length < 100

  if (isIrrelevant) {
    return {
      isPenalty: true,
      message: "请认真作答再继续解析",
      reason: "回答与问题不相关或过于敷衍",
      suggestions: ["请仔细阅读问题并针对性回答", "分享你的真实想法和经验", "即使不确定也请尝试分析和思考"],
    }
  }

  // Check for copy-paste or template answers
  const templatePhrases = [
    "根据我的理解",
    "我认为这个问题",
    "首先其次最后",
    "综上所述",
    "in my opinion",
    "first second third",
    "in conclusion",
  ]

  const templateCount = templatePhrases.filter((phrase) => answer.includes(phrase.toLowerCase())).length

  if (templateCount >= 3 && answer.length < 200) {
    return {
      isPenalty: true,
      message: "请认真作答再继续解析",
      reason: "回答过于模板化，缺乏个人思考",
      suggestions: ["请用自己的话来表达观点", "结合具体的工作经验或案例", "展示你独特的思考角度和见解"],
    }
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 [API] 开始处理API式教练评估请求")

    if (!SILICONFLOW_API_KEY) {
      console.error("❌ [API] SiliconFlow API密钥未配置")
      return NextResponse.json(
        {
          error: "SiliconFlow API key not configured",
          message: "请在项目设置中添加 SILICONFLOW_API_KEY 环境变量",
        },
        { status: 500 },
      )
    }

    const body: EvaluationRequest = await request.json()
    console.log("📝 [API] 收到API式教练评估请求:", {
      questionId: body.questionId,
      category: body.category,
      difficulty: body.difficulty,
      stage: body.stage || "professional",
      answerLength: body.userAnswer?.length,
    })

    // 验证请求数据
    if (!body.question || !body.userAnswer || !body.keyPoints) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const penaltyCheck = detectLowQualityAnswer(body.userAnswer, body.question)
    if (penaltyCheck) {
      console.log("⚠️ [惩罚机制] 检测到低质量回答，触发拒绝评分:", penaltyCheck.reason)
      return NextResponse.json(penaltyCheck, { status: 422 }) // 422 Unprocessable Entity
    }

    const prompt = buildEvaluationPrompt(body)
    console.log("📋 [API] 构建API式提示词完成")

    const requestPayload = {
      model: "deepseek-ai/DeepSeek-V3",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2, // Reduced temperature for more consistent API-like responses
      max_tokens: 3000,
    }

    const response = await fetch(SILICONFLOW_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SILICONFLOW_API_KEY}`,
      },
      body: JSON.stringify(requestPayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ [API] SiliconFlow API错误:`, errorText)
      throw new Error(`SiliconFlow API error: ${response.status}`)
    }

    const aiResponse = await response.json()
    const aiContent = aiResponse.choices[0]?.message?.content

    if (!aiContent) {
      throw new Error("No response from AI")
    }

    console.log("🔧 [API] 原始AI响应长度:", aiContent.length)

    let evaluationResult: EvaluationResponse
    try {
      const cleanedContent = cleanJsonResponse(aiContent)
      console.log("✨ [API] JSON清理完成，准备解析")

      try {
        evaluationResult = JSON.parse(cleanedContent)

        if (
          !evaluationResult.coreDiagnosis ||
          !evaluationResult.sentenceAnalysis ||
          !evaluationResult.deepDiveQuestion ||
          !evaluationResult.interviewerReaction // Added validation for interviewer reaction
        ) {
          console.warn("⚠️ [API] 响应格式不完整，可能触发拒绝评分机制")
        }
      } catch (parseError) {
        console.error("❌ [JSON解析] 详细错误信息:", parseError)
        console.error("🔍 [JSON解析] 清理后内容前500字符:", cleanedContent.substring(0, 500))

        throw parseError
      }

      console.log("✅ [API] API式教练评估解析成功:", {
        overallScore: evaluationResult.overallScore,
        rating: evaluationResult.rating,
        hasCoreDiagnosis: !!evaluationResult.coreDiagnosis,
        sentenceAnalysisCount: evaluationResult.sentenceAnalysis?.length,
        hasDeepDiveQuestion: !!evaluationResult.deepDiveQuestion,
        hasInterviewerReaction: !!evaluationResult.interviewerReaction, // Added interviewer reaction to success log
      })
    } catch (parseError) {
      console.error("❌ [API] JSON解析失败:", parseError)
      throw new Error("Invalid AI response format")
    }

    return NextResponse.json(evaluationResult)
  } catch (error) {
    console.error("💥 [API] API式教练评估错误:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      {
        error: errorMessage,
        message: "AI教练API服务暂时不可用，请稍后再试",
      },
      { status: 500 },
    )
  }
}
