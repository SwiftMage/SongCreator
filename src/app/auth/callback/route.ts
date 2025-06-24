import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  console.log('Callback route hit:', request.url)
  console.log('Origin:', origin)
  console.log('Code:', code)
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

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    console.log('Exchange error:', error)
    if (!error) {
      // Redirect directly to dashboard after successful OAuth
      console.log('Redirecting to dashboard')
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // Return to homepage with error if something went wrong
  return NextResponse.redirect(`${origin}/?error=auth_callback_error`)
}