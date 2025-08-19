import { createClient } from "@supabase/supabase-js"
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

  const response = NextResponse.next({
    request,
  })

  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        getAll() {
          return request.cookies.getAll().map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }))
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    })

    // 检查是否为认证回调
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get("code")

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        // 认证成功后重定向到首页
        return NextResponse.redirect(new URL("/", request.url))
      }
    }

    await supabase.auth.getSession()

    // 移除强制登录验证，允许匿名访问所有页面
    const isAuthRoute =
      request.nextUrl.pathname.startsWith("/auth/login") ||
      request.nextUrl.pathname.startsWith("/auth/sign-up") ||
      request.nextUrl.pathname === "/auth/callback"

    // 对于认证页面，如果用户已登录则重定向到首页
    if (isAuthRoute && request.nextUrl.pathname !== "/auth/callback") {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          return NextResponse.redirect(new URL("/", request.url))
        }
      } catch (error) {
        // 忽略错误，继续访问认证页面
        console.log("Session check failed in auth route, continuing")
      }
    }

    return response
  } catch (error) {
    console.log("Middleware session handling failed, continuing with anonymous access:", error)
    return response
  }
}
