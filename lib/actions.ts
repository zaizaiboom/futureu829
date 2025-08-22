"use server"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

// 登录操作
export async function signIn(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "表单数据缺失" }
  }

  const email = formData.get("email")
  const password = formData.get("password")

  if (!email || !password) {
    return { error: "邮箱和密码为必填项" }
  }

  // 检查环境变量是否配置
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    return { error: "Supabase配置缺失，请联系管理员配置环境变量" }
  }

  const cookieStore = await cookies()

  const supabase = createSupabaseClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // Ignore cookie setting errors in server actions
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch (error) {
          // Ignore cookie removal errors in server actions
        }
      },
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-server'
      }
    },
    // 开发环境配置：禁用速率限制
    realtime: {
      params: {
        eventsPerSecond: 1000 // 增加事件频率限制
      }
    }
  })

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.toString(),
      password: password.toString(),
    })

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("登录错误:", error)
    return { error: "发生意外错误，请重试" }
  }
}

// 注册操作 - 优化版本
export async function signUp(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "表单数据缺失" }
  }

  const email = formData.get("email")
  const password = formData.get("password")

  if (!email || !password) {
    return { error: "邮箱和密码为必填项" }
  }

  // 检查环境变量是否配置
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    return { error: "Supabase配置缺失，请联系管理员配置环境变量" }
  }

  const cookieStore = await cookies()

  const supabase = createSupabaseClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // Ignore cookie setting errors in server actions
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch (error) {
          // Ignore cookie removal errors in server actions
        }
      },
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-server'
      }
    },
    // 开发环境配置：禁用速率限制
    realtime: {
      params: {
        eventsPerSecond: 1000 // 增加事件频率限制
      }
    }
  })

  try {
    // 改进的注册策略：简化注册流程，避免profile创建问题
    const { data, error } = await supabase.auth.signUp({
      email: email.toString(),
      password: password.toString(),
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
          `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
        data: {
          email_confirm: false // 禁用邮箱确认以简化流程
        }
      },
    })

    if (error) {
      // 提供更友好的错误信息
      if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
        return { error: "该邮箱已被注册，请使用其他邮箱或尝试登录" }
      }
      if (error.message.includes('invalid email')) {
        return { error: "邮箱格式不正确，请检查后重试" }
      }
      if (error.message.includes('weak password')) {
        return { error: "密码强度不够，请使用至少6位包含字母和数字的密码" }
      }
      return { error: `注册失败: ${error.message}` }
    }

    // 如果注册成功但用户还未激活，尝试手动创建profile记录
    if (data.user && data.user.id) {
      try {
        // 使用服务端权限来创建profile记录
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({ 
            id: data.user.id, 
            email: email.toString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { 
            onConflict: 'id' 
          })

        if (profileError) {
          console.warn("Profile creation warning:", profileError.message)
          // 不因为profile创建失败而终止注册流程
        }
      } catch (profileErr) {
        console.warn("Profile creation error:", profileErr)
        // 继续注册流程，profile可以后续创建
      }
    }

    // 如果注册成功但需要邮箱确认，尝试自动登录
    if (data.user && !data.session) {
      try {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.toString(),
          password: password.toString(),
        })
        
        if (signInError) {
          console.warn("Auto sign-in after registration failed:", signInError.message)
          return { success: "注册成功！请尝试登录您的账户。" }
        }
      } catch (signInErr) {
        console.warn("Auto sign-in error:", signInErr)
        return { success: "注册成功！请尝试登录您的账户。" }
      }
    }

    return { success: "注册成功！正在为您登录..." }
  } catch (error) {
    console.error("注册错误:", error)
    return { error: "注册过程中发生错误，请稍后重试" }
  }
}

// 登出操作
export async function signOut() {
  // 检查环境变量是否配置
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase配置缺失，无法执行登出操作")
    redirect('/')
    return
  }

  const cookieStore = await cookies()

  const supabase = createSupabaseClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // Ignore cookie setting errors in server actions
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch (error) {
          // Ignore cookie removal errors in server actions
        }
      },
    },
  })

  await supabase.auth.signOut()
  redirect("/auth/login")
}
