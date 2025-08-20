import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from "react"

// 检查Supabase环境变量是否配置 (优先使用服务端环境变量)
function checkSupabaseConfig() {
  return (
    (typeof process.env.SUPABASE_URL === "string" &&
      process.env.SUPABASE_URL.length > 0 &&
      typeof process.env.SUPABASE_ANON_KEY === "string" &&
      process.env.SUPABASE_ANON_KEY.length > 0) ||
    (typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
      process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
      typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0)
  )
}

export const isSupabaseConfigured = checkSupabaseConfig()

export const createClient = cache(() => {
  const isConfigured = checkSupabaseConfig()
  if (!isConfigured) {
    console.warn("Supabase环境变量未设置，使用虚拟客户端")
    return createMockClient()
  }

  const cookieStore = cookies()

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      async getAll() {
        return (await cookieStore).getAll()
      },
      async setAll(cookiesToSet) {
        try {
          await Promise.all(
            cookiesToSet.map(async ({ name, value, options }) =>
              (await cookieStore).set(name, value, options)
            )
          )
        } catch {
          // Ignore if in Server Component
        }
      },
    },
  })
})

// 创建一个虚拟的Supabase客户端，用于未配置环境变量的情况
function createMockClient() {
  const mockAuth = {
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ data: null, error: { message: "Supabase未配置，请联系管理员" } }),
    signUp: async () => ({ data: null, error: { message: "Supabase未配置，请联系管理员" } }),
    signOut: async () => ({ error: null }),
    resetPasswordForEmail: async () => ({ data: null, error: { message: "Supabase未配置，请联系管理员" } }),
  }

  return {
    auth: mockAuth,
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: { message: "Supabase未配置，请联系管理员" } }),
      update: () => ({ data: null, error: { message: "Supabase未配置，请联系管理员" } }),
      delete: () => ({ data: null, error: { message: "Supabase未配置，请联系管理员" } }),
    }),
  }
}
