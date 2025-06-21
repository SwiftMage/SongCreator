'use client'

import Link from 'next/link'
import { 
  Music, 
  ArrowLeft, 
  Mail, 
  MessageCircle, 
  HelpCircle,
  Clock,
  CheckCircle
} from 'lucide-react'

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <Music className="h-8 w-8 text-purple-600" />
              <span className="text-2xl font-bold text-gray-900">SongCreator</span>
            </Link>
            
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 flex items-center space-x-2 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Support Center</h1>
            <p className="text-xl text-gray-600">
              We're here to help you create amazing personalized songs
            </p>
          </div>

          {/* Contact Support */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <Mail className="h-8 w-8 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">Contact Support</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Get Help</h3>
                <p className="text-gray-600 mb-4">
                  Have a question or need assistance? Our support team is ready to help you with any issues related to song creation, account management, or technical problems.
                </p>
                
                <div className="bg-purple-50 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <Mail className="h-6 w-6 text-purple-600" />
                    <span className="font-semibold text-purple-900">Email Support</span>
                  </div>
                  <p className="text-purple-800 mb-2">Send us an email at:</p>
                  <a 
                    href="mailto:appspire@icloud.com"
                    className="text-lg font-mono bg-white px-4 py-2 rounded-lg border border-purple-200 hover:border-purple-400 transition-colors inline-block"
                  >
                    appspire@icloud.com
                  </a>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Times</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <span className="text-gray-700">Typical response: 24-48 hours</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-gray-700">We respond to all inquiries</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MessageCircle className="h-5 w-5 text-blue-500" />
                    <span className="text-gray-700">Include as much detail as possible</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <HelpCircle className="h-8 w-8 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  How do I create a song?
                </h3>
                <p className="text-gray-600">
                  Creating a song is easy! First, make sure you have credits in your account. Then click "Create New Song" from your dashboard and follow the 4-step process: enter basic information about who the song is for, choose the song type, provide personal details or your own lyrics, and select your preferred musical style.
                </p>
              </div>

              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  How does the credit system work?
                </h3>
                <p className="text-gray-600">
                  Each song creation costs 1 credit. New users receive 1 free credit to try the service. You can purchase additional credits as needed. Credits are deducted when you start the song creation process.
                </p>
              </div>

              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Can I edit a song after it's created?
                </h3>
                <p className="text-gray-600">
                  Yes! You can edit any song from your dashboard by clicking the edit button. This allows you to modify the details and regenerate the song. Note that editing and regenerating a song will cost 1 additional credit.
                </p>
              </div>

              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  What audio formats are available?
                </h3>
                <p className="text-gray-600">
                  We provide songs in both MP3 (standard quality) and FLAC (high quality) formats. Most songs also come with multiple variations, so you can choose the version you like best.
                </p>
              </div>

              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Can I provide my own lyrics?
                </h3>
                <p className="text-gray-600">
                  Absolutely! During the song creation process, you can choose "I have my own lyrics" and provide your own text. We'll then create professional music to accompany your lyrics.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  How long does it take to generate a song?
                </h3>
                <p className="text-gray-600">
                  Song generation typically takes a few minutes. Lyric generation happens first (usually under a minute), followed by music generation which can take 2-5 minutes depending on server load. You'll see real-time progress updates during the process.
                </p>
              </div>
            </div>
          </div>

          {/* What to Include */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">When Contacting Support</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Please Include:</h3>
                <ul className="space-y-2 text-gray-600">
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Common Issues:</h3>
                <ul className="space-y-2 text-gray-600">
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
    </div>
  )
}