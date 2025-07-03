'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ensureUserProfile } from '@/lib/profile-utils'
import Logo from '@/components/Logo'
import DarkModeToggle from '@/components/DarkModeToggle'
import DevResetLink from '@/components/DevResetLink'
import { Mail, Lock, Eye, EyeOff, X } from 'lucide-react'

export default function AuthPage() {
  const [mode, setMode] = useState<'signup' | 'signin'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [showDevResetLink, setShowDevResetLink] = useState(false)
  const [devResetLink, setDevResetLink] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Check for URL messages on component mount
  useEffect(() => {
    const message = searchParams.get('message')
    if (message === 'profile_setup_required') {
      setError('Your profile setup is incomplete. Please log in again to complete the setup process.')
      setMode('signin') // Switch to signin mode
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    if (mode === 'signup') {
      // Validation for signup
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        setIsLoading(false)
        return
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters long')
        setIsLoading(false)
        return
      }

      try {
        console.log('Attempting signup...')
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })

        console.log('SignUp response:', JSON.stringify({ data, error }, null, 2))

        if (error) {
          console.log('Error detected:', error.message)
          
          // Handle rate limiting
          if (error.message.includes('For security purposes, you can only request this after')) {
            setError('You recently attempted to sign up with this email. Please wait a minute before trying again, or try signing in if you already have an account.')
            return
          }
          
          // Handle other specific errors
          if (error.message.includes('User already registered') || 
              error.message.includes('already registered') ||
              error.message.includes('already exists')) {
            setError('An account with this email already exists. Please try signing in instead.')
            return
          }
          
          setError(error.message)
          return
        }

        if (data.user) {
          console.log('User returned:', {
            id: data.user.id,
            email: data.user.email,
            created_at: data.user.created_at,
            email_confirmed_at: data.user.email_confirmed_at,
            hasSession: !!data.session,
            confirmation_sent_at: data.user.confirmation_sent_at
          })
          
          // Simple duplicate check: if user exists but no session and not confirmed
          // and was created more than 1 minute ago, it's likely a duplicate
          if (!data.session && !data.user.email_confirmed_at && data.user.created_at) {
            const userCreatedTime = new Date(data.user.created_at).getTime()
            const now = Date.now()
            const timeDiff = now - userCreatedTime
            
            console.log('Time since user creation:', timeDiff, 'ms')
            
            if (timeDiff > 60000) { // 1 minute
              setError('An account with this email already exists but is not verified. Please check your email for the verification link or try signing in.')
              return
            }
          }
          
          // Check if confirmation email was sent
          if (data.user.confirmation_sent_at) {
            setSuccess('Check your email for a verification link!')
          } else {
            setSuccess('Account created! Please check your email for a verification link.')
          }
          
          // Clear form
          setEmail('')
          setPassword('')
          setConfirmPassword('')
        } else {
          console.log('Warning: No user returned from signup')
          setError('Registration failed. Please try again.')
        }
      } catch {
        setError('An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    } else {
      // Sign in logic
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          setError(error.message)
          return
        }

        if (data.user) {
          // Ensure user has a profile before redirecting
          const profileResult = await ensureUserProfile(data.user)
          
          if (!profileResult.success) {
            setError(`Profile setup failed: ${profileResult.error}. Please try again or contact support.`)
            return
          }

          console.log('User signed in successfully with profile:', profileResult.profile?.id)
          router.push('/dashboard')
        }
      } catch {
        setError('An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Password reset requested for redacted email')
      }
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (process.env.NODE_ENV === 'development') {
        console.log('Reset response error status:', !!error)
      }

      if (error) {
        console.error('Password reset error:', error)
        
        // In development, if email fails, show manual reset link
        if (process.env.NODE_ENV === 'development' && error.message.includes('Error sending')) {
          console.log('Email failed, generating manual reset link...')
          
          try {
            // Generate a proper recovery link via API
            const response = await fetch('/api/dev-reset-link', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: resetEmail })
            })
            
            if (response.ok) {
              const { recoveryUrl } = await response.json()
              setDevResetLink(recoveryUrl)
              setShowDevResetLink(true)
              setShowForgotPassword(false)
              setError('')
              return
            }
          } catch (err) {
            console.error('Failed to generate dev reset link:', err)
          }
        }
        
        setError(error.message)
        return
      }

      console.log('Password reset email sent successfully')
      setSuccess('Password reset email sent! Check your inbox for further instructions.')
      setResetEmail('')
      setShowForgotPassword(false)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setIsLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        setError(error.message)
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const switchMode = () => {
    setMode(mode === 'signup' ? 'signin' : 'signup')
    setError('')
    setSuccess('')
    // Clear password fields when switching
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
          {showForgotPassword ? (
            // Password Reset View
            <>
              {/* Reset Password Header */}
              <div className="text-center mb-8">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex-1"></div>
                  <Logo />
                  <div className="flex-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false)
                        setResetEmail('')
                        setError('')
                        setSuccess('')
                      }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Reset your password
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  We'll send you a link to reset your password
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-6">
                  <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-6">
                  <p className="text-green-600 dark:text-green-400 text-sm">{success}</p>
                </div>
              )}

              {/* Reset Password Form */}
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div>
                  <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <input
                      id="resetEmail"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder="Enter your email"
                      required
                      autoFocus
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-purple-600 text-white py-4 rounded-lg font-semibold hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Email'}
                </button>
              </form>

              {/* Back to login link */}
              <div className="mt-6 text-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Remember your password? </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false)
                    setResetEmail('')
                    setError('')
                    setSuccess('')
                  }}
                  className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold"
                >
                  Back to sign in
                </button>
              </div>
            </>
          ) : (
            // Normal Auth View
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex-1"></div>
                  <Logo />
                  <div className="flex-1 flex justify-end">
                    <DarkModeToggle />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {mode === 'signup' ? 'Create your account' : 'Welcome back'}
                </h1>
              </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-6">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-6">
              <p className="text-green-600 dark:text-green-400 text-sm">{success}</p>
            </div>
          )}

          {/* Google Auth */}
          <button
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 dark:bg-gray-800 py-4 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
            <span className="px-4 text-sm text-gray-500 dark:text-gray-400">or</span>
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder={mode === 'signup' ? 'Create a password' : 'Enter your password'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Forgot Password Link - only show in signin mode */}
            {mode === 'signin' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true)
                    setError('')
                    setSuccess('')
                  }}
                  className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 text-white py-4 rounded-lg font-semibold hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (mode === 'signup' ? 'Creating account...' : 'Signing in...') : (mode === 'signup' ? 'Create account' : 'Sign in')}
            </button>
          </form>


          {/* Mode switch */}
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
            {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={switchMode}
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold"
            >
              {mode === 'signup' ? 'Sign in' : 'Sign up'}
            </button>
          </p>
          
          {/* Terms of Service and Privacy Policy */}
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
            By {mode === 'signup' ? 'creating an account' : 'signing in'}, you agree to our{' '}
            <Link href="/terms" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 underline">
              Terms of Service
            </Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 underline">
              Privacy Policy
            </Link>
          </p>
            </>
          )}
        </div>
      </div>
      
      {/* Development Reset Link Modal */}
      {showDevResetLink && (
        <DevResetLink
          resetLink={devResetLink}
          onClose={() => {
            setShowDevResetLink(false)
            setDevResetLink('')
          }}
        />
      )}
    </div>
  )
}