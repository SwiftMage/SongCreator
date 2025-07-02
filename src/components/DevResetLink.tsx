'use client'

import { useState } from 'react'
import { Copy, X, AlertCircle } from 'lucide-react'

interface DevResetLinkProps {
  resetLink: string
  onClose: () => void
}

export default function DevResetLink({ resetLink, onClose }: DevResetLinkProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resetLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-yellow-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Development Mode: Email Service Unavailable
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Email sending is currently unavailable (likely due to DNS verification pending). 
              Here's your password reset link to use manually:
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password Reset Link:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={resetLink}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono"
              />
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>Copy the link above</li>
              <li>Open it in a new browser tab</li>
              <li>You'll be redirected to the password reset page</li>
              <li>Enter your new password to complete the reset</li>
            </ol>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            Note: This fallback is only shown in development mode when email sending fails.
          </div>
        </div>
      </div>
    </div>
  )
}