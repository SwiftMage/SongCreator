'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { CreditCard, RefreshCw } from 'lucide-react'

interface UserCreditsProps {
  userId?: string
  className?: string
  showRefresh?: boolean
}

export default function UserCredits({ 
  userId, 
  className = '', 
  showRefresh = false 
}: UserCreditsProps) {
  const [credits, setCredits] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchCredits = async () => {
    if (!userId) return

    setIsLoading(true)
    setError(null)

    try {
      // This will now only work if the user is fetching their own credits
      // due to our RLS policies
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('credits_remaining')
        .eq('id', userId)
        .single()

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          setError('Profile not found')
        } else {
          setError('Unable to load credits')
        }
        console.error('Error fetching credits:', profileError)
      } else {
        setCredits(profileData?.credits_remaining || 0)
      }
    } catch (err) {
      setError('Failed to load credits')
      console.error('Credits fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCredits()
  }, [userId])

  const handleRefresh = async () => {
    await fetchCredits()
  }

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
        <span className="text-gray-500">Loading...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <CreditCard className="h-4 w-4 text-red-500" />
        <span className="text-red-500 text-sm">{error}</span>
        {showRefresh && (
          <button
            onClick={handleRefresh}
            className="text-blue-500 hover:text-blue-600 text-sm"
          >
            Retry
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <CreditCard className="h-4 w-4 text-purple-600 dark:text-purple-400" />
      <span className="font-medium text-gray-900 dark:text-white">
        {credits} {credits === 1 ? 'credit' : 'credits'}
      </span>
      {showRefresh && (
        <button
          onClick={handleRefresh}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          title="Refresh credits"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}