'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Mail, 
  MessageCircle, 
  HelpCircle,
  Clock,
  CheckCircle,
  Send,
  X
} from 'lucide-react'
import Logo from '@/components/Logo'
import DarkModeToggle from '@/components/DarkModeToggle'
import { createClient } from '@/lib/supabase/client'

export default function SupportPage() {
  const [showContactForm, setShowContactForm] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/send-support-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          message,
        }),
      })

      if (response.ok) {
        setSubmitStatus('success')
        setSubject('')
        setMessage('')
        setTimeout(() => {
          setShowContactForm(false)
          setSubmitStatus('idle')
        }, 2000)
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Error sending email:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo />
            
            <div className="flex items-center space-x-4">
              <DarkModeToggle />
              <Link
                href="/"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center space-x-2 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Home</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Support Center</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              We&apos;re here to help you create amazing personalized songs
            </p>
          </div>

          {/* Contact Support */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <Mail className="h-8 w-8 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Contact Support</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Get Help</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Have a question or need assistance? Our support team is ready to help you with any issues related to song creation, account management, or technical problems.
                </p>
                
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <Mail className="h-6 w-6 text-purple-600" />
                    <span className="font-semibold text-purple-900 dark:text-purple-300">Contact Support</span>
                  </div>
                  <p className="text-purple-800 dark:text-purple-400 mb-4">Get help with your account or technical issues:</p>
                  <button
                    onClick={() => setShowContactForm(true)}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                  >
                    <Send className="h-5 w-5" />
                    <span>Send Support Request</span>
                  </button>
                  <p className="text-sm text-purple-700 dark:text-purple-300 mt-2">
                    Or email us directly at: <a href="mailto:appspire@icloud.com" className="underline">appspire@icloud.com</a>
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Response Times</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300">Typical response: 24-48 hours</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">We respond to all inquiries</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MessageCircle className="h-5 w-5 text-blue-500" />
                    <span className="text-gray-700 dark:text-gray-300">Include as much detail as possible</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <HelpCircle className="h-8 w-8 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-6">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  How do I create a song?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Creating a song is easy! First, make sure you have credits in your account. Then click &quot;Create New Song&quot; from your dashboard and follow the 4-step process: enter basic information about who the song is for, choose the song type, provide personal details or your own lyrics, and select your preferred musical style.
                </p>
              </div>

              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  How does the credit system work?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Each song creation costs 1 credit. New users receive 1 free credit to try the service. You can purchase additional credits as needed. Credits are deducted when you start the song creation process.
                </p>
              </div>

              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Can I edit a song after it&apos;s created?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Yes! You can edit any song from your dashboard by clicking the edit button. This allows you to modify the details and regenerate the song. Note that editing and regenerating a song will cost 1 additional credit.
                </p>
              </div>

              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  What audio formats are available?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  We provide songs in both MP3 (standard quality) and FLAC (high quality) formats. Most songs also come with multiple variations, so you can choose the version you like best.
                </p>
              </div>

              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Can I provide my own lyrics?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Absolutely! During the song creation process, you can choose &quot;I have my own lyrics&quot; and provide your own text. We&apos;ll then create professional music to accompany your lyrics.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  How long does it take to generate a song?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Song generation typically takes a few minutes. Lyric generation happens first (usually under a minute), followed by music generation which can take 2-5 minutes depending on server load. You&apos;ll see real-time progress updates during the process.
                </p>
              </div>
            </div>
          </div>

          {/* What to Include */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">When Contacting Support</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Please Include:</h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>Your account email address</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>Song ID (if applicable)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>Detailed description of the issue</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>Steps you took before the issue occurred</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>Any error messages you received</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Common Issues:</h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>Song generation failures</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>Audio playback problems</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>Credit or billing questions</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>Account access issues</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>Feature requests or feedback</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Contact Support</h2>
                <button
                  onClick={() => setShowContactForm(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Tell us about your issue and we'll get back to you soon.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="What can we help you with?"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Please describe your issue or question in detail..."
                />
              </div>

              {submitStatus === 'success' && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 text-green-800 dark:text-green-300">
                  Your support request has been sent successfully! We'll get back to you soon.
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 text-red-800 dark:text-red-300">
                  There was an error sending your request. Please try again or email us directly at appspire@icloud.com
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowContactForm(false)}
                  className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Send className="h-5 w-5" />
                  <span>{isSubmitting ? 'Sending...' : 'Send Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}