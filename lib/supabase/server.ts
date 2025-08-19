import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
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

export const createClient = cache(async () => {
  const isConfigured = checkSupabaseConfig()
  if (!isConfigured) {
    console.warn("Supabase环境变量未设置，使用虚拟客户端")
    return createMockClient()
  }

  try {
    const cookieStore = await cookies()

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    return createSupabaseClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            console.log("Cookie setting failed in server component, this is expected")
          }
        },
      },
    })
  } catch (error) {
    console.warn("Server client creation failed, using mock client:", error)
    return createMockClient()
  }
})

function createMockClient() {
  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signUp: () => Promise.resolve({ data: null, error: { message: "Supabase未配置" } }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: "Supabase未配置" } }),
      signOut: () => Promise.resolve({ error: null }),
      exchangeCodeForSession: () => Promise.resolve({ data: null, error: null }),
    },
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: { message: "Supabase未配置" } }),
      update: () => Promise.resolve({ data: null, error: { message: "Supabase未配置" } }),
      delete: () => Promise.resolve({ data: null, error: { message: "Supabase未配置" } }),
    }),
  } as any
}
