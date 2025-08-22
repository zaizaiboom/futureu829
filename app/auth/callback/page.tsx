import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { NextRequest } from "next/server"

export default async function AuthCallback({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string }>
}) {
  const { code, error } = await searchParams

  if (error) {
    console.error('Auth callback error:', error)
    redirect('/auth/login?error=callback_error')
  }

  if (code) {
    try {
      const supabase = await createClient()
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Code exchange error:', exchangeError)
        redirect('/auth/login?error=exchange_error')
      }
      
      if (data.session) {
        console.log('Session created successfully:', data.session.user.email)
        // 重定向到首页
        redirect('/')
      }
    } catch (err) {
      console.error('Unexpected error during auth callback:', err)
      redirect('/auth/login?error=unexpected_error')
    }
  }

  // 如果没有code参数，重定向到登录页
  redirect('/auth/login')
}
