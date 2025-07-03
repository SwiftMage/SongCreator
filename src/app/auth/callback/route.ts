import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ensureUserProfile } from '@/lib/profile-utils'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type') // Supabase adds this for different auth flows
  
  console.log('Callback route hit:', request.url)
  console.log('Origin:', origin)
  console.log('Code:', code)
  console.log('Type:', type)
  console.log('All search params:', Object.fromEntries(searchParams.entries()))

  if (code) {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    console.log('Exchange error:', error)
    console.log('Exchange data:', data)
    
    if (!error && data.user) {
      // Check if this is a password recovery flow
      if (type === 'recovery') {
        console.log('Redirecting to reset password page')
        return NextResponse.redirect(`${origin}/auth/reset-password`)
      }
      
      // For OAuth providers (like Google), ensure profile exists
      console.log('User authenticated via callback, ensuring profile exists...')
      const profileResult = await ensureUserProfile(data.user)
      
      if (!profileResult.success) {
        console.error('Profile creation failed in callback:', profileResult.error)
        return NextResponse.redirect(`${origin}/auth?error=profile_setup_failed`)
      }
      
      console.log('Profile ensured for user:', data.user.id)
      
      // For OAuth flows, redirect directly to dashboard since email is already verified
      if (data.user.app_metadata?.provider && data.user.app_metadata.provider !== 'email') {
        console.log('OAuth user, redirecting to dashboard')
        return NextResponse.redirect(`${origin}/dashboard`)
      }
      
      // For email verification flows, redirect to verified page
      console.log('Email user, redirecting to verified page')
      return NextResponse.redirect(`${origin}/auth/verified`)
    }
  }

  // Return to homepage with error if something went wrong
  return NextResponse.redirect(`${origin}/?error=auth_callback_error`)
}