import { supabase } from "./supabase/client"

export interface Question {
  id: number
  question_text: string
  category_id: number
  stage_id: number
  difficulty_level: string
  expected_answer: string
  keywords: string[]
}

export interface QuestionCategory {
  id: number
  category_name: string
  stage_id: number
  description: string
}

export interface InterviewStage {
  id: number
  stage_name: string
  description: string
}

// 获取所有面试阶段
export async function getInterviewStages(): Promise<InterviewStage[]> {
  const { data, error } = await supabase
    .from('interview_stages')
    .select('*')
    .order('id')

  if (error) {
    console.error('Error fetching interview stages:', error)
    return []
  }

  return data || []
}

// 根据阶段获取问题分类
export async function getQuestionCategories(stageId?: number): Promise<QuestionCategory[]> {
  let query = supabase
    .from('question_categories')
    .select('*')
    .order('id')

  if (stageId) {
    query = query.eq('stage_id', stageId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching question categories:', error)
    return []
  }

  return data || []
}

// 根据阶段随机获取问题
export async function getRandomQuestions(
  stageId: number,
  categoryId?: number,
  count: number = 5
): Promise<Question[]> {
  let query = supabase
    .from('interview_questions')
    .select('*')
    .eq('stage_id', stageId)

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data, error } = await query.limit(count * 2) // 获取更多数据以便随机选择

  if (error) {
    console.error('Error fetching questions:', error)
    return []
  }

  // 随机选择指定数量的题目
  const shuffled = (data || []).sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

// 根据分类随机获取问题
export async function getRandomQuestionsByCategory(categoryId: number, count = 2): Promise<Question[]> {
  const { data, error } = await supabase.from("interview_questions").select("*").eq("category_id", categoryId)

  if (error) {
    console.error("Error fetching questions by category:", error)
    return []
  }

  if (!data || data.length === 0) {
    return []
  }

  // 随机打乱并选择指定数量的问题
  const shuffled = data.sort(() => 0.5 - Math.random())
  return shuffled.slice(0, Math.min(count, data.length))
}

// 获取特定阶段的所有问题
export async function getQuestionsByStage(stageId: number): Promise<Question[]> {
  const { data, error } = await supabase
    .from("interview_questions")
    .select("*")
    .eq("stage_id", stageId)
    .order("category_id", { ascending: true })

  if (error) {
    console.error("Error fetching questions by stage:", error)
    return []
  }

  return data || []
}

// 获取特定阶段的题目数量
export async function getQuestionCount(stageId: number, categoryId?: number): Promise<number> {
  let query = supabase
    .from('interview_questions')
    .select('id', { count: 'exact' })
    .eq('stage_id', stageId)

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { count, error } = await query

  if (error) {
    console.error('Error fetching question count:', error)
    return 0
  }

  return count || 0
}

export async function getQuestionStats(): Promise<{
  totalQuestions: number
  questionsByStage: { stage_id: number; count: number; stage_name: string }[]
}> {
  // 获取总题目数
  const { count: totalQuestions } = await supabase
    .from("interview_questions")
    .select("*", { count: "exact", head: true })

  // 获取各阶段题目分布
  const { data: stageStats } = await supabase.from("interview_questions").select(`
      stage_id,
      interview_stages!inner(stage_name)
    `)

  const questionsByStage =
    stageStats?.reduce(
      (acc, item) => {
        const existing = acc.find((s) => s.stage_id === item.stage_id)
        if (existing) {
          existing.count++
        } else {
          acc.push({
            stage_id: item.stage_id,
            count: 1,
            stage_name: item.interview_stages.stage_name,
          })
        }
        return acc
      },
      [] as { stage_id: number; count: number; stage_name: string }[],
    ) || []

  return {
    totalQuestions: totalQuestions || 0,
    questionsByStage,
  }
}

export async function debugDatabaseConnection(): Promise<void> {
  console.log("=== 数据库连接调试信息 ===")

  try {
    // 检查面试阶段
    const stages = await getInterviewStages()
    console.log("面试阶段:", stages)

    // 检查问题分类
    const { data: categories } = await supabase.from("question_categories").select("*").order("id")
    console.log("问题分类:", categories)

    // 检查每个阶段的题目数量（使用新的统计函数）
    for (const stage of stages) {
      const count = await getQuestionCount(stage.id)
      console.log(`阶段 ${stage.stage_name} (ID: ${stage.id}) 有 ${count} 道题目`)

      // 获取几道示例题目
      const sampleQuestions = await getRandomQuestions(stage.id, 3)
      console.log(
        `示例题目:`,
        sampleQuestions.map((q) => q.question_text.substring(0, 30) + "..."),
      )
    }

    // 检查原始数据分布
    const { data: rawData } = await supabase.from("interview_questions").select("stage_id, category_id")

    const distribution = rawData?.reduce(
      (acc, item) => {
        const key = `stage_${item.stage_id}_cat_${item.category_id}`
        acc[key] = (acc[key] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    console.log("题目分布:", distribution)
  } catch (error) {
    console.error("数据库连接调试失败:", error)
  }
}
