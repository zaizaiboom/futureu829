// 文件路径: /lib/supabase/client.ts

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // 注意：这里使用的是 createBrowserClient
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}