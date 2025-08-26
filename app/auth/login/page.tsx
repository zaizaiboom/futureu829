import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import LoginForm from "@/components/login-form"

export const dynamic = "force-dynamic"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  // 如果Supabase未配置，显示设置消息
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">请连接Supabase以开始使用</h1>
      </div>
    )
  }

  const { error } = await searchParams
  let errorMessage = ''
  
  if (error) {
    switch (error) {
      case 'callback_error':
        errorMessage = '登录回调出现错误，请重试'
        break
      case 'exchange_error':
        errorMessage = '登录验证失败，请重试'
        break
      case 'unexpected_error':
        errorMessage = '登录过程中出现意外错误，请重试'
        break
      default:
        errorMessage = '登录出现错误，请重试'
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{errorMessage}</p>
        </div>
      )}
      <LoginForm />
    </div>
  )
}
