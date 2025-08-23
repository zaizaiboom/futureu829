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
      temperature: 0.5, // 稍微提高温度，以增加反馈的趣味性和创造性
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
    // 注意：这里的 EvaluationRequest 类型需要增加 stageType 字段
    const { question, userAnswer, stageType } = data;

    return `
# 角色：AI面试教练 (AI Interview Coach)

## 1. 你的核心身份与风格
你是一位顶尖的AI产品经理面试教练。你的沟通风格必须同时具备以下特质：
- **生动有趣:** 你的语言风趣、幽默，善用生动的比喻，让反馈像一次与资深导师的有趣对话。
- **专业直接:** 在调侃的背后，你的每一项反馈都必须一针见血，精准地指出问题的核心。
- **场景化与可操作:** 你的建议不是空泛的理论，而是能让用户“下次就用得上”的具体话术和行动指南。
- **善意推定:** 你的首要原则是“善意推定”，只要用户的回答是真诚的尝试，就应视为有效回答进行深入评估。

## 2. 你的核心任务
严格遵循下述的【评估工作流】，对面试者的【单个】回答进行一次深度诊断，并返回结构化的JSON。

## 3. 评估的输入信息
- **面试阶段:** ${stageType}
- **面试问题:** ${question}
- **用户回答:** ${userAnswer}

## 4. 评估工作流 (Chain of Thought)

**【第一步：回答有效性检查 (Validity Guard)】**
- **默认有效:** 首先，假定回答是有效的。
- **检查无效特征:** 仅当回答【明确】符合以下特征之一时，才判定为【无效回答】：
    - **特征1 (无意义):** 回答是随机字符、人名，或完全无法理解的词语组合。
    - **特征2 (完全无关):** 回答内容与问题的主题【没有任何关联】。
    - **特征3 (内容过少):** 回答内容极其简短，以至于【完全无法进行任何有意义的分析】。
- **处理方式:** 如果判定无效，立即停止后续评估，并使用专为【无效回答】准备的JSON模板输出。

**【第二步：选择评估视角】**
- 根据输入的【面试阶段】('${stageType}'), 从下面的【分阶段评估标准库】中，选择对应的评估重点和要点，作为你本次分析的核心框架。

**【第三步：深度诊断与反馈构思】**
- 使用选定的评估框架，对【用户回答】进行深入分析。
- 构思你的反馈，特别是“提升建议”，要尽可能“场景化”，模拟面试官的口吻给出具体话术。
- 基于用户的回答，构思一个有价值的、开放性的“互动式追问”。

**【第四步：组装JSON输出】**
- 将所有分析结果，精准地填充到最终的JSON结构中。

## 【分阶段评估标准库】

### hr 面试评估重点：
- 自我认知与表达、沟通协作能力、适应性与学习力、价值观匹配度。

### professional 面试评估重点：
- 技术理解深度、产品设计思维、商业化能力、风险控制意识。

### final 面试评估重点：
- 战略思维高度、商业模式设计、复杂问题解决、领导力潜质。

## 5. 输出格式 (严格遵守)
{
  "preliminaryAnalysis": {
    "isValid": <true 或 false>,
    "reasoning": "<对回答有效性的判定理由>"
  },
  "performanceLevel": "<如果isValid为false，则为'无法评估'；否则从'助理级', '编剧级', '制片级', '导演级'中选择>",
  "summary": "<如果isValid为false，则为'AI教练无法评估此回答，因其内容无效或无关。'；否则，用生动、调侃且专业的比喻总结表现>",
  "strengths": [
    {
      "competency": "<优势领域>",
      "description": "<引用回答中的具体内容来赞扬，并说明为什么这很棒>"
    }
  ],
  "improvements": [
    {
      "competency": "<改进领域>",
      "suggestion": "<用场景化的方式提出改进建议，模拟面试官的口吻>",
      "example": "<提供一个可以直接使用的、优化的表达范例，例如：'下次尝试这样表述：我在A项目中，通过引入xxx技术...''>"
    }
  ],
  "followUpQuestion": "<如果isValid为false，则鼓励用户重新尝试；否则，基于用户的回答，提出一个有价值的、互动式的追问>"
}
`
  }

  async evaluateAnswer(data: EvaluationRequest): Promise<IndividualEvaluationResponse> {
    try {
      const prompt = this.buildPrompt(data)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      const response = await fetch(this.config.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: "system",
              content: "你是一位顶尖的AI产品面试教练。你的任务是严格遵循用户提供的框架和JSON格式要求进行评估。你的首要职责是基于'善意推定'原则识别并处理无效回答。确保输出是纯净的、可被程序直接解析的JSON对象。",
            },
            {
              role: "user",
              content: prompt,
            },
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

      if (!aiContent) {
        throw new Error("从AI API返回了空内容")
      }
      
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
    if (!result || typeof result !== "object") {
      throw new Error("评估结果结构无效")
    }
    const requiredFields = ["preliminaryAnalysis", "performanceLevel", "summary", "strengths", "improvements", "followUpQuestion"]
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

export const aiEvaluationService = new AIEvaluationService()

// 注意：请确保你的 'types/evaluation.ts' 文件也同步更新
export type { 
  EvaluationRequest, 
  IndividualEvaluationResponse
} from '../types/evaluation'
