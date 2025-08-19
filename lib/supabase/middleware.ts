import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse, type NextRequest } from "next/server"

// 检查Supabase环境变量是否配置
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

export async function updateSession(request: NextRequest) {
  // 如果Supabase未配置，直接继续
  if (!isSupabaseConfigured) {
    return NextResponse.next({
      request,
    })
  }

  const res = NextResponse.next()

  // 创建配置为使用cookies的Supabase客户端
  const supabase = createMiddlewareClient({ req: request, res })

  // 检查是否为认证回调
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    // 交换code获取session
    await supabase.auth.exchangeCodeForSession(code)
    // 认证成功后重定向到首页
    return NextResponse.redirect(new URL("/", request.url))
  }

  // 刷新过期的session - 服务器组件需要（但不强制要求登录）
  try {
    await supabase.auth.getSession()
  } catch (error) {
    // 忽略session错误，允许匿名访问
    console.log("Session refresh failed, continuing with anonymous access")
  }

  // 移除强制登录验证，允许匿名访问所有页面
  // 只有认证相关的页面需要特殊处理
  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/auth/login") ||
    request.nextUrl.pathname.startsWith("/auth/sign-up") ||
    request.nextUrl.pathname === "/auth/callback"

  // 对于认证页面，如果用户已登录则重定向到首页
  if (isAuthRoute) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session && request.nextUrl.pathname !== "/auth/callback") {
        return NextResponse.redirect(new URL("/", request.url))
      }
    } catch (error) {
      // 忽略错误，继续访问认证页面
    }
  }

  return res
}
