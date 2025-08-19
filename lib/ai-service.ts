// DeepSeek V3 AI评估服务

interface EvaluationRequest {
  questionId: number
  question: string
  userAnswer: string
  keyPoints: string[]
  category: string
  difficulty: string
}

interface EvaluationResponse {
  score: number
  strengths: string[]
  improvements: string[]
  coverageAnalysis: {
    point: string
    covered: boolean
    score: number
  }[]
  detailedScore: {
    content: number
    logic: number
    expression: number
  }
}

class AIEvaluationService {
  private readonly apiUrl = "https://api.deepseek.com/v1/chat/completions"
  private readonly apiKey: string

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || ""
    if (!this.apiKey) {
      throw new Error("DEEPSEEK_API_KEY environment variable is required")
    }
  }

  // 构建评估提示词
  private buildPrompt(data: EvaluationRequest): string {
    const keyPointsList = data.keyPoints.map((point, index) => `${index + 1}. ${point}`).join("\n")

    return `你是一名资深的AI产品经理面试官和专业的面试教练。请根据以下信息严格、客观地评估面试者的回答。

面试问题：${data.question}

问题类别：${data.category}
难度等级：${data.difficulty}

评分关键要点：
${keyPointsList}

用户回答：
${data.userAnswer}

请��以下三个维度进行评估：
1. 内容匹配度（40%）：回答是否覆盖关键要点，语义相似度如何
2. 逻辑与结构（30%）：回答是否有条理，逻辑是否清晰
3. 语言表达（30%）：表达是否流畅、专业、精确

请严格按照以下JSON格式返回评估结果，不要添加任何其他内容：
{
  "score": <1到100之间的整数>,
  "strengths": [
    "<具体的优点1，要具体且有建设性>",
    "<具体的优点2，要具体且有建设性>",
    "<具体的优点3，要具体且有建设性>"
  ],
  "improvements": [
    "<具体的改进建议1，要可操作>",
    "<具体的改进建议2，要可操作>",
    "<具体的改进建议3，要可操作>"
  ],
  "coverageAnalysis": [
${data.keyPoints
  .map(
    (point) => `    {
      "point": "${point}",
      "covered": <true或false>,
      "score": <如果covered为true，给出0-100的分数，否则为0>
    }`,
  )
  .join(",\n")}
  ],
  "detailedScore": {
    "content": <内容匹配度分数，满分40>,
    "logic": <逻辑结构分数，满分30>,
    "expression": <语言表达分数，满分30>
  }
}`
  }

  // 调用DeepSeek API进行评估
  async evaluateAnswer(data: EvaluationRequest): Promise<EvaluationResponse> {
    try {
      const prompt = this.buildPrompt(data)

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content:
                "你是一名专业的AI产品经理面试官，具有丰富的面试经验和评估能力。请严格按照要求返回JSON格式的评估结果。",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 2000,
          response_format: { type: "json_object" },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`DeepSeek API error (${response.status}): ${errorText}`)
      }

      const aiResponse = await response.json()
      const aiContent = aiResponse.choices[0]?.message?.content

      if (!aiContent) {
        throw new Error("No response content from DeepSeek API")
      }

      // 解析AI返回的JSON
      let evaluationResult: EvaluationResponse
      try {
        evaluationResult = JSON.parse(aiContent)
      } catch (parseError) {
        console.error("Failed to parse AI response:", aiContent)
        throw new Error("Invalid JSON response from AI")
      }

      // 验证返回数据的完整性
      this.validateEvaluationResult(evaluationResult)

      return evaluationResult
    } catch (error) {
      console.error("AI evaluation error:", error)
      throw error
    }
  }

  // 验证评估结果的数据结构
  private validateEvaluationResult(result: any): void {
    if (!result || typeof result !== "object") {
      throw new Error("Invalid evaluation result structure")
    }

    const requiredFields = ["score", "strengths", "improvements", "coverageAnalysis", "detailedScore"]
    for (const field of requiredFields) {
      if (!(field in result)) {
        throw new Error(`Missing required field: ${field}`)
      }
    }

    if (typeof result.score !== "number" || result.score < 0 || result.score > 100) {
      throw new Error("Invalid score value")
    }

    if (!Array.isArray(result.strengths) || !Array.isArray(result.improvements)) {
      throw new Error("Strengths and improvements must be arrays")
    }

    if (!Array.isArray(result.coverageAnalysis)) {
      throw new Error("Coverage analysis must be an array")
    }

    if (!result.detailedScore || typeof result.detailedScore !== "object") {
      throw new Error("Invalid detailed score structure")
    }
  }

  // 生成备用评估结果（当AI服务不可用时）
  generateFallbackEvaluation(data: EvaluationRequest): EvaluationResponse {
    const baseScore = Math.floor(Math.random() * 20) + 70 // 70-90分

    return {
      score: baseScore,
      strengths: ["回答结构相对清晰，有一定的逻辑性", "对问题有基本的理解和思考", "表达较为流畅，语言组织能力良好"],
      improvements: ["建议结合更多具体案例来支撑观点", "可以进一步深入分析问题的本质", "表达可以更加精炼和专业"],
      coverageAnalysis: data.keyPoints.map((point) => ({
        point,
        covered: Math.random() > 0.3,
        score: Math.floor(Math.random() * 20) + 75,
      })),
      detailedScore: {
        content: Math.floor(baseScore * 0.4),
        logic: Math.floor(baseScore * 0.3),
        expression: Math.floor(baseScore * 0.3),
      },
    }
  }
}

// 导出单例实例
export const aiEvaluationService = new AIEvaluationService()
export type { EvaluationRequest, EvaluationResponse }
