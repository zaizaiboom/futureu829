import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"

// 检查Supabase环境变量是否配置
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

// 创建一个虚拟的Supabase客户端，用于未配置环境变量的情况
const createMockSupabaseClient = () => {
  const mockAuth = {
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ data: null, error: { message: "Supabase未配置，请联系管理员" } }),
    signUp: async () => ({ data: null, error: { message: "Supabase未配置，请联系管理员" } }),
    signOut: async () => ({ error: null }),
    resetPasswordForEmail: async () => ({ data: null, error: { message: "Supabase未配置，请联系管理员" } })
  }
  
  return {
    auth: mockAuth,
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: { message: "Supabase未配置，请联系管理员" } }),
      update: () => ({ data: null, error: { message: "Supabase未配置，请联系管理员" } }),
      delete: () => ({ data: null, error: { message: "Supabase未配置，请联系管理员" } })
    })
  }
}

// 创建Supabase客户端实例
let supabaseClient: any

if (isSupabaseConfigured) {
  try {
    // 为开发环境禁用速率限制
    supabaseClient = createClientComponentClient({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      options: {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce'
        },
        global: {
          headers: {
            'X-Client-Info': 'supabase-js-web'
          }
        },
        // 开发环境配置：禁用速率限制
        realtime: {
          params: {
            eventsPerSecond: 1000 // 增加事件频率限制
          }
        }
      }
    })
  } catch (error) {
    console.warn("Supabase客户端创建失败，使用虚拟客户端", error)
    supabaseClient = createMockSupabaseClient()
  }
} else {
  console.warn("Supabase环境变量未配置，使用虚拟客户端")
  supabaseClient = createMockSupabaseClient()
}

export const supabase = supabaseClient
