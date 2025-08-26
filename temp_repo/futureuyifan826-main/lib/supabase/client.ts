// 文件路径: /lib/supabase/client.ts

import { createBrowserClient } from '@supabase/ssr'

// 创建带有网络错误处理的Supabase客户端
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      // 自动刷新token
      autoRefreshToken: true,
      // 持久化会话
      persistSession: true,
      // 检测会话变化
      detectSessionInUrl: true,
      // 设置更长的超时时间
      flowType: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': 'futureu-web-app'
      },
      // 网络请求配置
      fetch: (url, options = {}) => {
        return fetch(url, {
          ...options,
          // 设置超时时间
          signal: AbortSignal.timeout(30000), // 30秒超时
        }).catch(error => {
          console.error('🌐 Supabase network error:', error);
          // 如果是网络错误，抛出更友好的错误信息
          if (error.name === 'AbortError' || error.message.includes('fetch')) {
            throw new Error('网络连接超时，请检查网络连接后重试');
          }
          throw error;
        });
      }
    }
  }
);

// 添加全局错误处理
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('🔄 Token refreshed successfully');
  } else if (event === 'SIGNED_OUT') {
    console.log('👋 User signed out');
  }
});