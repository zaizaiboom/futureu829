// AI产品导师评估服务 - 产品方案融合最终版
// 融合了分阶段评估、场景化反馈和互动式追问，并优化了有效性判断

import type {
  EvaluationRequest,
  IndividualEvaluationResponse,
  EvaluationServiceConfig,
} from '../types/evaluation'

class AIEvaluationService {
  private readonly config: EvaluationServiceConfig

  constructor() {
    this.config = {
      apiUrl: "https://api.siliconflow.cn/v1/chat/completions",
      apiKey: process.env.SILICONFLOW_API_KEY || "",
      model: "deepseek-ai/DeepSeek-V3", 
      temperature: 0.3, // 稍微提高温度，以增加反馈的趣味性和创造性
      maxTokens: 3000,
      timeout: 45000 // 适当延长超时，以应对更复杂的评估任务
    }
    
    if (!this.config.apiKey) {
      console.error("💥 [AI Service] SILICONFLOW_API_KEY 环境变量未设置")
      throw new Error("SILICONFLOW_API_KEY environment variable is required")
    }
  }

  /**
   * 构建AI产品导师评估提示词 - 已升级为最终融合版
   */
  private buildPrompt(data: EvaluationRequest): string {
     const { question, userAnswer, stageType, questionAnalysis, answerFramework } = data;

     return `
 # 角色：AI面试教练 (AI Interview Coach)
 
 ## 1. 你的核心身份与风格
 你是一位顶尖的、拥有“教练战术手册”的AI产品经理面试教练。你的沟通风格生动、专业且极具洞察力。你的评估【必须】基于提供的“问题分析”和“建议回答思路”来进行。
 
 ## 2. 你的核心任务
 严格遵循下述【评估工作流】，对面试者的【单个】回答进行一次深度诊断，并返回结构化的JSON。
 
 ## 3. 教练战术手册 (你的评估基准)
 - **面试问题:** ${question}
 - **问题分析 (本题的核心考点):** ${questionAnalysis}
 - **建议回答思路 (高分答案的框架):** ${answerFramework}
 
 ## 4. 评估对象
 - **面试阶段:** ${stageType}
 - **用户回答:** ${userAnswer}
 
 ## 5. 评估工作流 (Chain of Thought)
 
 **【第一步：智能有效性检查 (Intelligent Validity Guard)】- 这是最关键的判断**
 - **这是你的守门员职责，但【必须】基于“教练战术手册”来判断。**
 - **检查流程:**
     1.  **初步筛选:** 回答是否是完全无意义的随机字符或人名？如果是，则直接判定为【无效回答】。
     2.  **深度对比:** 如果不是无意义内容，你【必须】将【用户回答】与【教练战术手册】（特别是“建议回答思路”）进行语义和概念上的对比。
     3.  **最终判定:** 只有当【用户回答】与【教练战术手册】在核心概念上**【零相关性】**时，才判定为【无效回答】。一个简短但切题的回答（例如，只提到了思路中的一个关键词）应被视为【有效回答】，并在后续步骤中指出其“内容不够充分”。
 - **处理方式:** 如果判定无效，立即停止后续评估，并使用专为【无效回答】准备的JSON模板输出。
 
 **【第二步：对比诊断 (Comparative Diagnosis)】**
 - **仅当**回答被判定为【有效】时，才进行此步骤。你需要将【用户回答】与【教练战术手册】进行详细比对。
 
 **【第三步：构思反馈与追问】**
 - **亮点 (Strengths):** 找到用户回答中，与“战术手册”匹配得最好、或者最有洞察力的部分。
 - **建议 (Improvements):** 找到用户回答与“战术手册”之间最大的差距，并构思场景化的、可操作的改进建议。
 - **追问 (Follow-up):** 基于用户的回答，构思一个能进一步考察其思维深度的互动式追问。
 
 **【第四步：组装JSON输出】**
 - 将所有分析结果，精准地填充到最终的JSON结构中。
 
 ## 6. 输出格式 (严格遵守)
 {
   "preliminaryAnalysis": {
     "isValid": <true 或 false>,
     "reasoning": "<对回答有效性的判定理由>"
   },
   "performanceLevel": "<如果isValid为false，则为'无法评估'；否则从'助理级', '编剧级', '制片级', '导演级'中选择>",
   "summary": "<如果isValid为false，则为'AI教练无法评估此回答...'；否则，基于与'战术手册'的对比，给出一句生动、调侃且专业的总结>",
   "strengths": [
     {
       "competency": "<优势领域>",
       "description": "<引用具体内容，说明其如何符合了'战术手册'中的要求或展现了个人亮点>"
     }
   ],
   "improvements": [
     {
       "competency": "<改进领域>",
       "suggestion": "<明确指出用户的回答与'战术手册'的差距所在，并用场景化的方式提出改进建议>",
       "example": "<提供一个可以直接使用的、优化的表达范例>"
     }
   ],
   "followUpQuestion": "<如果isValid为false，则鼓励用户重新尝试；否则，基于用户的回答，提出一个有价值的、互动式的追问>",
   "expertGuidance": {
       "questionAnalysis": "${questionAnalysis}",
       "answerFramework": "${answerFramework}"
   }
 }
 `
   }

  async evaluateAnswer(data: EvaluationRequest): Promise<IndividualEvaluationResponse> {
     try {
       if (!data.questionAnalysis || !data.answerFramework) {
         throw new Error("评估请求缺少'questionAnalysis'或'answerFramework'字段");
       }
 
       const prompt = this.buildPrompt(data)
       const controller = new AbortController()
       const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)
 
       const response = await fetch(this.config.apiUrl, {
         method: "POST",
         headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.config.apiKey}` },
         body: JSON.stringify({
           model: this.config.model,
           messages: [
             {
               role: "system",
               content: "你是一位顶尖的AI产品面试教练。你的任务是严格遵循用户提供的框架和JSON格式要求进行评估。你的首要职责是基于提供的'教练战术手册'来智能地判断回答的有效性。确保输出是纯净的、可被程序直接解析的JSON对象。",
             },
             { role: "user", content: prompt },
           ],
           temperature: this.config.temperature,
           max_tokens: this.config.maxTokens,
           response_format: { type: "json_object" },
         }),
         signal: controller.signal,
       })
 
       clearTimeout(timeoutId)
 
       if (!response.ok) {
         const errorText = await response.text().catch(() => "无法读取错误响应体");
         console.error(`💥 [AI Service] API 响应错误 (${response.status}): ${errorText}`);
         throw new Error(`AI API error (${response.status})`)
       }
 
       const aiResponse = await response.json()
       const aiContent = aiResponse.choices[0]?.message?.content
       if (!aiContent) { throw new Error("从AI API返回了空内容") }
        
       let evaluationResult: IndividualEvaluationResponse;
       try {
         const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
         if (jsonMatch) {
           evaluationResult = JSON.parse(jsonMatch[0]);
         } else {
           throw new Error("响应中未找到有效的JSON对象");
         }
       } catch (parseError) {
         console.error("❌ [AI Service] 解析AI响应失败:", aiContent)
         throw new Error(`从AI返回了无效的JSON: ${parseError.message}`)
       }
 
       this.validateIndividualEvaluationResult(evaluationResult)
       return evaluationResult
     } catch (error) {
       console.error("💣 [AI Service] 评估过程中发生错误:", error)
       return this.generateFallbackEvaluation(data, error.message)
     }
   }

  private validateIndividualEvaluationResult(result: any): void {
    if (!result || typeof result !== "object") { throw new Error("评估结果结构无效") }
    const requiredFields = ["preliminaryAnalysis", "performanceLevel", "summary", "strengths", "improvements", "followUpQuestion", "expertGuidance"];
    for (const field of requiredFields) {
      if (!(field in result)) {
        throw new Error(`缺少必需字段: ${field}`)
      }
    }
    if (!result.preliminaryAnalysis || typeof result.preliminaryAnalysis.isValid !== 'boolean') {
      throw new Error('preliminaryAnalysis 或其 isValid 属性无效')
    }
  }
  
  generateFallbackEvaluation(data: EvaluationRequest, errorMessage: string = "AI服务暂时不可用"): IndividualEvaluationResponse {
    return {
      preliminaryAnalysis: {
        isValid: false, 
        reasoning: `评估服务发生错误: ${errorMessage}`
      },
      performanceLevel: "无法评估",
      summary: "抱歉，AI教练的评估服务暂时遇到了点小麻烦，无法完成本次评估。",
      strengths: [],
      improvements: [
        {
          competency: "系统稳定性",
          suggestion: "这通常是一个临时性问题，比如网络波动或AI服务繁忙。",
          example: "请稍等片刻后，尝试重新提交或刷新页面。如果问题持续存在，请联系技术支持。"
        }
      ],
      followUpQuestion: "请尝试重新提交，我们期待你的精彩回答！"
    }
  }
}

// 延迟实例化，避免在客户端环境中执行构造函数
let _aiEvaluationService: AIEvaluationService | null = null

export const getAIEvaluationService = (): AIEvaluationService => {
  if (!_aiEvaluationService) {
    _aiEvaluationService = new AIEvaluationService()
  }
  return _aiEvaluationService
}

// 导出类本身，让API路由可以按需实例化
export { AIEvaluationService }

// 注意：请确保你的 'types/evaluation.ts' 文件也同步更新
export type { 
  EvaluationRequest, 
  IndividualEvaluationResponse
} from '../types/evaluation'
