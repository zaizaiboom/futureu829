import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { stageType, questions, answers, stageTitle, questionSetIndex, async } = await request.json()

    console.log("🎯 [API] 收到套题评估请求:", {
      stageType,
      stageTitle,
      questionSetIndex,
      questionCount: questions?.length,
      answerCount: answers?.length,
      asyncMode: async,
    })

    if (async) {
      // 生成评估ID
      const evaluationId = `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // 异步处理评估（实际项目中可以使用队列系统）
      setTimeout(async () => {
        try {
          await processEvaluation(stageType, questions, answers, stageTitle, questionSetIndex, evaluationId)
          console.log("✅ [API] 异步评估完成:", evaluationId)
          // 这里可以发送通知给用户
        } catch (error) {
          console.error("💥 [API] 异步评估失败:", evaluationId, error)
        }
      }, 0)

      return NextResponse.json({
        evaluationId,
        message: "评估已启动，结果将异步生成",
        status: "processing",
      })
    }

    // 同步评估模式（保持向后兼容）
    const result = await processEvaluation(stageType, questions, answers, stageTitle, questionSetIndex)
    return NextResponse.json(result)
  } catch (error) {
    console.error("💥 [API] 套题评估错误:", error)

    return NextResponse.json(
      {
        error: "套题评估失败",
        message: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 },
    )
  }
}

async function processEvaluation(
  stageType: string,
  questions: string[],
  answers: string[],
  stageTitle: string,
  questionSetIndex: number,
  evaluationId?: string,
) {
  const apiKey = process.env.SILICONFLOW_API_KEY
  if (!apiKey) {
    console.error("💥 [API] SILICONFLOW_API_KEY 环境变量未设置")
    throw new Error("AI服务配置错误：缺少API密钥")
  }

  const evaluationPrompt = `
你是一位专业的AI产品经理面试官，请用友好但直接的方式对候选人进行评估。采用轻松调侃但专业的语调，让反馈更加生动有趣。

## 评估原则
- 用形象化的比喻和调侃式语言让反馈更有趣
- 明确说明评分依据和改进方向，避免模糊表述
- 用具体的例子和量化标准指导改进
- 重点关注实际能力和成长潜力
- 每个建议都要具体可操作

## 题目信息
套题标题: ${stageTitle}
面试模块: ${stageType}
题目组: 第${questionSetIndex}组
题目数量: ${questions.length}

## 题目与回答
${questions
  .map(
    (q: string, i: number) => `
题目${i + 1}: ${q}
回答${i + 1}: ${answers[i] || "未回答"}
`,
  )
  .join("\n")}

## 分阶段评估标准

### HR面试评估重点：
- **自我认知与表达（25%）**：能否清晰阐述职业动机，展现对AI PM角色的理解
- **沟通协作能力（30%）**：跨职能团队协调能力，冲突解决经验
- **适应性与学习力（25%）**：面对变化的应对策略，持续学习意识
- **价值观匹配度（20%）**：用户至上理念，AI伦理意识

评估要点：
- 是否有具体的项目案例和量化数据
- 能否体现AI产品经理的独特思维
- 表达是否清晰有逻辑

### 专业面试评估重点：
- **技术理解深度（35%）**：对AI技术原理、应用场景的掌握程度
- **产品设计思维（30%）**：AI产品设计能力，用户体验与技术平衡
- **商业化能力（25%）**：技术价值转化，ROI评估能力
- **风险控制意识（10%）**：AI伦理、模型风险的理解和应对

评估要点：
- 技术概念是否准确，能否转化为商业价值
- 产品设计是否考虑了AI特性
- 是否有实际的产品化经验

### 终面评估重点：
- **战略思维高度（40%）**：行业趋势判断，长期规划能力
- **商业模式设计（30%）**：定价策略，市场分析能力
- **复杂问题解决（20%）**：多维度权衡，系统性分析
- **领导力潜质（10%）**：决策能力，团队影响力

评估要点：
- 战略分析是否有数据支撑
- 商业思维是否成熟
- 能否处理复杂的业务场景

## 反馈风格要求
1. **总结部分**：用生动的比喻说明当前水平，如"你的回答像是一部制作精良的纪录片，但缺少了导演的个人风格"
2. **优势分析**：具体指出表现好的地方，用实例说明，要有调侃但认可的语调
3. **改进建议**：直接指出需要改进的地方，用形象化的描述，提供具体的行动建议
4. **下一步行动**：给出明确的学习和提升路径，要具体可执行

## 请严格按照以下JSON格式返回：

{
  "performanceLevel": "<根据整体表现评定：'导演级表现'、'制片级表现'、'编剧级表现'、'助理级表现'之一>",
  "summary": "<用轻松调侃但专业的语调总结表现，必须包含形象化比喻，2-3句话，如：'你的回答就像是一部制作精良的简历纪录片，情节完整但缺少高光时刻。在技术理解上表现不错，但在商业化思维上还需要更多'导演思维'。'>",
  "strengths": [
    {
      "area": "具体优势领域",
      "description": "用调侃但认可的语调描述表现好的地方，要引用具体回答内容，说明为什么这样评价"
    }
  ],
  "improvements": [
    {
      "area": "改进领域", 
      "suggestion": "用形象化的描述指出问题，提供直接的改进建议，要具体可操作",
      "example": "举例说明具体怎么表达更好，包含具体的数据或案例要求，如：'可以这样说：通过引入RAG架构，将客服响应准确率从78%提升到94%，用户满意度提升30%'"
    }
  ],
  "nextSteps": [
    {
      "focus": "重点关注领域",
      "actionable": "具体可执行的行动建议，包含时间节点和量化目标，如：'未来2周内准备3个完整的AI产品案例，每个案例都要包含技术选型、商业价值和量化结果'"
    }
  ],
  "encouragement": "鼓励性结语，要让人感到被理解和支持，指明成长方向，用轻松但专业的语调"
}

## 评估要求
1. 每个建议都要具体可操作，包含量化标准
2. 明确说明评分依据，让用户理解为什么得到这个评价
3. 保持轻松调侃但专业友好的语调
4. performanceLevel要体现AI产品经理的职业层级感
5. 确保JSON格式正确，所有字符串值用双引号包围
6. 重点关注实际能力和成长潜力，提供建设性反馈
7. 每个描述都要有具体的比喻或形象化表达

请提供专业、有趣、有建设性的评估反馈。
`

  try {
    console.log("🚀 [API] 开始调用AI服务，API Key存在:", !!apiKey)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 45000) // 30秒超时

    const aiResponse = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-ai/DeepSeek-V3",
        messages: [
          {
            role: "system",
            content:
              "你是一位专业友好的AI产品经理面试官。请严格按照要求的JSON格式返回评估结果，确保JSON语法完全正确。重点说明评分依据，提供具体可操作的改进建议，保持轻松调侃但专业友好的语调。",
          },
          {
            role: "user",
            content: evaluationPrompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 3000,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    console.log("📡 [API] AI服务响应状态:", aiResponse.status, aiResponse.statusText)

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text().catch(() => "无法读取错误信息")
      console.error("💥 [API] AI服务响应错误:", {
        status: aiResponse.status,
        statusText: aiResponse.statusText,
        errorText: errorText.substring(0, 200),
      })
      throw new Error(`AI服务响应错误: ${aiResponse.status} ${aiResponse.statusText}`)
    }

    const aiResult = await aiResponse.json()
    const evaluationText = aiResult.choices[0]?.message?.content

    if (!evaluationText) {
      console.error("💥 [API] AI服务返回空结果:", aiResult)
      throw new Error("AI服务返回空结果")
    }

    console.log("🤖 [API] AI原始评估结果:", evaluationText.substring(0, 200) + "...")

    let evaluationResult
    try {
      // 策略1: 直接解析（如果AI返回的就是纯JSON）
      evaluationResult = JSON.parse(evaluationText.trim())
    } catch (directParseError) {
      try {
        // 策略2: 提取JSON部分
        const jsonMatch = evaluationText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          let jsonStr = jsonMatch[0]
          // 清理常见的JSON格式问题
          jsonStr = jsonStr
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // 移除控制字符
            .replace(/,(\s*[}\]])/g, "$1") // 移除多余的逗号
            .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // 确保属性名有引号

          evaluationResult = JSON.parse(jsonStr)
        } else {
          throw new Error("无法从AI响应中提取JSON")
        }
      } catch (extractParseError) {
        // 策略3: 使用备用评估结果
        console.error("💥 [API] JSON解析失败，使用备用评估:", extractParseError)
        evaluationResult = createFallbackEvaluation(stageType, answers)
      }
    }

    if (!evaluationResult.performanceLevel || !evaluationResult.summary) {
      console.warn("⚠️ [API] 评估结果缺少必要字段，使用备用评估")
      evaluationResult = createFallbackEvaluation(stageType, answers)
    }

    console.log("✅ [API] 套题评估成功:", {
      evaluationId: evaluationId || "sync",
      performanceLevel: evaluationResult.performanceLevel,
      strengthsCount: evaluationResult.strengths?.length,
      improvementsCount: evaluationResult.improvements?.length,
    })

    return evaluationResult
  } catch (error) {
    if (error.name === "AbortError") {
      console.error("💥 [API] 请求超时:", error)
      throw new Error("AI服务请求超时，请稍后重试")
    } else if (error.message?.includes("fetch")) {
      console.error("💥 [API] 网络连接失败:", error)
      throw new Error("网络连接失败，请检查网络连接后重试")
    } else {
      console.error("💥 [API] 评估过程出错:", error)
      throw new Error(`评估失败: ${error.message || "未知错误"}`)
    }
  }
}

function createFallbackEvaluation(stageType: string, answers: string[]) {
  const hasAnswers = answers.some((answer) => answer && answer.trim().length > 0)

  const stageSpecificFeedback = {
    hr: {
      performanceLevel: hasAnswers ? "编剧级表现" : "助理级表现",
      summary: hasAnswers
        ? "你的回答就像是一部制作精良的简历纪录片，情节完整但缺少高光时刻。在基础表达上不错，但还需要更多'导演思维'来展现你的独特价值。"
        : "看起来你还在为这场'大片'做准备呢！建议先完整回答所有问题，让我们看看你的'剧本'写得如何。",
      improvements: [
        {
          area: "从旁白升级为导演",
          suggestion: "别只说'我做了什么'，要说'我为什么这么做'。每个项目都要体现你的决策思维和独特价值。",
          example:
            "比如：'在某AI客服项目中，面对用户满意度只有3.2分的问题，我通过数据分析发现是响应准确率低，主导引入RAG技术，最终将满意度提升到4.6分，响应准确率从78%提升到94%'",
        },
        {
          area: "添加量化数据特效",
          suggestion: "用具体的数据和结果来证明你的影响力，让你的故事更有说服力。",
          example: "在描述项目时，要说明具体的业务指标变化，如'用户留存率提升30%'、'成本降低50万'等",
        },
      ],
    },
    professional: {
      performanceLevel: hasAnswers ? "编剧级表现" : "助理级表现",
      summary: hasAnswers
        ? "你对技术概念有基本了解，像是一个认真的技术编剧。但在技术与商业价值的转化上，还需要更多'制片人'的商业嗅觉。"
        : "专业面试需要展现你的技术理解和商业思维，建议先完整回答问题，让我们看看你的'技术大片'构思如何。",
      improvements: [
        {
          area: "技术商业化转化",
          suggestion: "在讨论技术时，要明确说明技术选择的商业考量和实际效果，用数据证明价值。",
          example:
            "不要只说'使用了RAG技术'，要说'选择RAG而不是微调是因为成本考虑，RAG方案节省了60%的算力成本，同时将响应准确率提升到92%，预计年节省运营成本50万'",
        },
        {
          area: "数据飞轮特效",
          suggestion: "要展现'数据-模型-业务'的闭环思维，说明AI技术如何形成商业价值的正循环。",
          example:
            "描述AI产品时要包含：用户数据如何改进模型→模型优化如何提升用户体验→用户体验提升如何带来更多数据和收入",
        },
      ],
    },
    final: {
      performanceLevel: hasAnswers ? "编剧级表现" : "助理级表现",
      summary: hasAnswers
        ? "你有一定的行业认知，像是一个有想法的编剧。但在战略思维的深度和执行路径的具体性上，还需要更多'导演'的全局视野。"
        : "终面需要展现你的战略思维和商业洞察，建议先完整回答问题，让我们看看你的'商业大片'构思。",
      improvements: [
        {
          area: "战略分析深度",
          suggestion: "战略判断要有数据支撑，要说明分析的方法论和信息来源，避免空泛的趋势描述。",
          example:
            "不要只说'AI Agent有前景'，要说'基于对50家企业的调研，发现80%的公司在客服自动化上有需求，预计市场规模100亿，我们可以从金融行业切入，目标获得15%市场份额'",
        },
        {
          area: "绘制商业施工图",
          suggestion: "要展现完整的商业思维，包括市场分析、竞争策略、盈利模式等，并有具体的执行计划。",
          example:
            "描述商业策略时要包含：目标市场规模、竞争对手分析、差异化优势、定价策略、获客成本、盈利预期等具体要素",
        },
      ],
    },
  }

  const stageFeedback =
    stageSpecificFeedback[stageType as keyof typeof stageSpecificFeedback] || stageSpecificFeedback.hr

  return {
    performanceLevel: stageFeedback.performanceLevel,
    summary: stageFeedback.summary,
    strengths: hasAnswers
      ? [
          {
            area: "基础理解能力",
            description:
              "对问题有基本的理解，回答有一定的逻辑性，这是一个好的开始。就像是一个认真的实习生，基础功扎实。",
          },
          {
            area: "学习态度",
            description: "愿意参与面试练习，展现了积极的学习态度。这种主动学习的精神很值得认可，是成长的重要基础。",
          },
        ]
      : [
          {
            area: "学习意愿",
            description: "主动进行面试练习，这是成长的重要第一步。就像是一个有潜力的新人，关键是要开始行动。",
          },
        ],
    improvements: stageFeedback.improvements,
    nextSteps: [
      {
        focus: "案例库建设",
        actionable:
          "未来2周内准备3-5个完整的项目案例，每个案例都要包含背景、挑战、解决方案、结果和反思，重点突出你的决策过程和量化影响",
      },
      {
        focus: "AI产品知识体系",
        actionable:
          "建立系统的学习计划：每周研究一个AI产品案例，分析其技术架构、商业模式和用户价值，形成自己的分析框架",
      },
    ],
    encouragement:
      "你已经迈出了重要的第一步！AI产品经理就像是一个既懂技术又懂商业的'导演'，需要在技术理解、产品思维和商业洞察之间找到平衡。通过持续的学习和实践，相信你能够从'实习助理'成长为'优秀导演'。记住，每个成功的AI产品经理都是从第一次面试开始成长的！",
  }
}
