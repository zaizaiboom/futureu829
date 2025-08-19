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

interface EvaluationResponse {
  overallScore: number
  coreCompetencyScores: {
    productThinking: number
    technicalUnderstanding: number
    projectManagement: number
    businessAcumen: number
  }
  performanceScores: {
    communication: number
    logicalStructure: number
    confidence: number
    adaptability: number
  }
  rating: string
  summary: string
  aiDiagnosis: string
  coachGuidance: string
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

function buildEvaluationPrompt(data: EvaluationRequest): string {
  const stageConfig = getStageConfig(data.stage || "professional")

  return `你是一位资深AI产品总监，拥有10年以上的AI产品管理经验。现在你的角色是一名实战教练，专门帮助候选人快速提升面试表现。你的任务不是评价，而是直接告诉候选人"怎么改才能拿高分"。

当前面试阶段：${stageConfig.stageName}
面试问题：${data.question}
问题类别：${data.category}
难度等级：${data.difficulty}

## ${stageConfig.stageName}评估标准

${stageConfig.evaluationCriteria}

评分关键要点：
${data.keyPoints.map((point, index) => `${index + 1}. ${point}`).join("\n")}

用户回答：
${data.userAnswer}

## 实战教练指导要求

### AI诊断格式（直接指出问题）：
"你的回答有个致命问题：[具体问题]。这让面试官觉得你[负面印象]。要拿高分，你必须[具体改进方向]。"

### 教练指导格式（给出具体改法）：
"立即这样改：
1. 开头直接说：'[具体开场白模板]'
2. 中间加上：'[具体内容模板]'  
3. 结尾要说：'[具体结尾模板]'
这样改完，你的回答就能从[当前分数]提升到[目标分数]。"

${stageConfig.specificGuidance}

### 战略建议格式（可直接套用的模板）：
每个建议必须包含：
- tag: 具体改进点
- suggestion: 详细的操作步骤，包含可以直接说的话
- example: 完整的示例回答片段，用户可以直接参考

### 核心能力维度评分（1-10分）：
1. **产品思维**：${stageConfig.productThinking}
2. **技术理解**：${stageConfig.technicalUnderstanding}  
3. **项目管理**：${stageConfig.projectManagement}
4. **商业化能力**：${stageConfig.businessAcumen}

### 综合表现维度评分（1-10分）：
1. **沟通表达**：语言流畅度、专业性、精确性
2. **逻辑结构**：条理清晰、重点突出、结构完整
3. **自信度**：表达自信、有说服力
4. **临场反应**：面对问题的敏捷解决能力

请严格按照以下JSON格式返回评估结果：
{
  "overallScore": <综合得分，1-100整数，计算公式：(核心能力平均分*0.7 + 综合表现平均分*0.3)*10>,
  "coreCompetencyScores": {
    "productThinking": <产品思维得分，1-10>,
    "technicalUnderstanding": <技术理解得分，1-10>,
    "projectManagement": <项目管理得分，1-10>,
    "businessAcumen": <商业化能力得分，1-10>
  },
  "performanceScores": {
    "communication": <沟通表达得分，1-10>,
    "logicalStructure": <逻辑结构得分，1-10>,
    "confidence": <自信度得分，1-10>,
    "adaptability": <临场反应得分，1-10>
  },
  "rating": "<根据总分给出评级：90+为'优秀'，80-89为'良好'，70-79为'合格'，60-69为'待提升'，<60为'需要重新准备'>",
  "summary": "<简洁的总体表现总结，50-80字>",
  "aiDiagnosis": "<按照AI诊断格式，直接指出致命问题，80-120字>",
  "coachGuidance": "<按照教练指导格式，给出具体改法和模板，150-200字>",
  "highlights": [
    {
      "tag": "<具体亮点标签>",
      "description": "<详细描述该亮点，引用具体内容，60-80字>"
    }
  ],
  "improvements": [
    {
      "tag": "<具体问题标签>", 
      "description": "<直接说出问题和立即改进方法，80-100字>"
    }
  ],
  "strategicSuggestions": [
    {
      "tag": "<改进点>",
      "suggestion": "<详细操作步骤，包含具体话术模板，120-150字>",
      "example": "<完整的示例回答片段，用户可直接参考，80-120字>"
    }
  ]
}`
}

function getStageConfig(stage: string) {
  switch (stage) {
    case "hr":
      return {
        stageName: "HR面 - 职业匹配度与潜力评估",
        evaluationCriteria: `
评估能力：职业动机、自我认知、沟通协作、职业规划

评估标准：
- 职业动机真实性（高）：对AI PM岗位的理解是否深入，动机是否源于热爱而非盲从
- 自我认知清晰度（高）：对自身优势、劣势和未来发展路径是否有清晰规划  
- 团队协作软实力（高）：能否在复杂团队环境中有效沟通和解决冲突`,
        productThinking: "用户痛点识别、职业规划与产品理解的结合",
        technicalUnderstanding: "AI技术基础认知、学习能力展现",
        projectManagement: "团队协作经验、沟通协调能力",
        businessAcumen: "职业发展规划、行业理解深度",
        specificGuidance: `
### HR面高分模板：
- **开场必杀技**："我有X年相关经验，专门做过Y类AI产品，最擅长Z技能"
- **经验量化法**："在上个项目中，我通过XX方法，实现了YY%的提升"
- **主动提问术**："我想了解这个岗位最大的挑战是什么？"`,
      }
    case "final":
      return {
        stageName: "终面 - 战略思维与行业洞察评估",
        evaluationCriteria: `
评估能力：战略思维、行业洞察、商业模式设计、复杂场景分析

评估标准：
- 行业洞察力（高）：对AI行业趋势（如Agent、多模态）有前瞻性见解
- 战略规划能力（高）：能从宏观层面思考产品，并设计可行的商业模式
- 复杂问题拆解能力（高）：面对开放性难题，能结构化地分析和解决`,
        productThinking: "战略产品规划、商业模式设计、市场洞察",
        technicalUnderstanding: "前沿技术趋势理解、技术商业化能力",
        projectManagement: "复杂项目统筹、资源配置优化",
        businessAcumen: "商业模式创新、投资回报分析、竞争策略",
        specificGuidance: `
### 终面高分模板：
- **战略开场**："从行业趋势看，我认为这个问题的核心是..."
- **格局展现**："我会从用户价值、技术可行性、商业模式三个维度来分析"
- **决心表达**："我对这个机会非常认真，已经深入研究了贵公司的..."`,
      }
    default: // professional
      return {
        stageName: "专业面 - 硬核能力与实践评估",
        evaluationCriteria: `
评估能力：产品设计思维、技术理解力、商业化能力、数据驱动能力

评估标准：
- 技术理解深度（高）：能否清晰解释AI技术原理，并与产品场景结合
- 产品落地能力（高）：是否能设计出可行的AI产品方案，并考虑数据飞轮
- 商业化平衡能力（高）：在追求技术效果的同时，能否兼顾成本、收益和用户价值`,
        productThinking: "产品方案设计、用户体验优化、数据驱动决策",
        technicalUnderstanding: "AI技术原理理解、技术方案选择、技术商业化",
        projectManagement: "跨团队协作、项目推进、风险管控",
        businessAcumen: "ROI分析、成本效益平衡、商业价值创造",
        specificGuidance: `
### 专业面高分模板：
- **结论先行**："我的建议是XX，主要基于三个考虑..."
- **技术落地**："从技术角度，我会选择XX方案，因为它能平衡效果和成本"
- **数据证明**："根据我的经验，这样做通常能带来XX%的提升"`,
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

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 [API] 开始处理教练式评估请求")

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
    console.log("📝 [API] 收到教练式评估请求:", {
      questionId: body.questionId,
      category: body.category,
      difficulty: body.difficulty,
      stage: body.stage || "professional", // Log stage information
      answerLength: body.userAnswer?.length,
    })

    // 验证请求数据
    if (!body.question || !body.userAnswer || !body.keyPoints) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const prompt = buildEvaluationPrompt(body)
    console.log("📋 [API] 构建教练式提示词完成")

    const requestPayload = {
      model: "deepseek-ai/DeepSeek-V3",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
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
      } catch (parseError) {
        console.error("❌ [JSON解析] 详细错误信息:", parseError)
        console.error("🔍 [JSON解析] 清理后内容前500字符:", cleanedContent.substring(0, 500))
        console.error(
          "🔍 [JSON解析] 清理后内容后500字符:",
          cleanedContent.substring(Math.max(0, cleanedContent.length - 500)),
        )

        // Try to identify the problematic character position
        if (parseError instanceof SyntaxError && parseError.message.includes("position")) {
          const match = parseError.message.match(/position (\d+)/)
          if (match) {
            const position = Number.parseInt(match[1])
            const context = cleanedContent.substring(Math.max(0, position - 50), position + 50)
            console.error("🎯 [JSON解析] 错误位置上下文:", context)
          }
        }

        throw parseError
      }

      console.log("✅ [API] 教练式评估解析成功:", {
        overallScore: evaluationResult.overallScore,
        rating: evaluationResult.rating,
        hasAiDiagnosis: !!evaluationResult.aiDiagnosis, // Log new coaching fields
        hasCoachGuidance: !!evaluationResult.coachGuidance,
        highlightsCount: evaluationResult.highlights?.length,
      })
    } catch (parseError) {
      console.error("❌ [API] JSON解析失败:", parseError)
      throw new Error("Invalid AI response format")
    }

    return NextResponse.json(evaluationResult)
  } catch (error) {
    console.error("💥 [API] 教练式评估API错误:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      {
        error: errorMessage,
        message: "AI教练服务暂时不可用，请稍后再试",
      },
      { status: 500 },
    )
  }
}
