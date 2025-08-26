'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = formData.get('redirectTo') as string

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Login error:', error)
    const errorParam = error.message.includes('Invalid login credentials') 
      ? 'invalid_credentials'
      : 'unknown_error'
    redirect(`/auth/login?error=${errorParam}${redirectTo ? `&redirectTo=${encodeURIComponent(redirectTo)}` : ''}`)
  }

  revalidatePath('/', 'layout')
  redirect(redirectTo || '/learning-report')
}
