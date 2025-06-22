'use client'

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from '@/lib/supabase';
import { Music, Heart, Gift, Users, LogOut, User } from "lucide-react";

export default function Home() {
  const [user, setUser] = useState<{ user_metadata?: { full_name?: string }, email?: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setIsLoading(false)
    }
    checkAuth()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Music className="h-8 w-8 text-purple-600" />
            <span className="text-2xl font-bold text-gray-900">SongCreator</span>
          </div>
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
            ) : user ? (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/dashboard"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Dashboard
                </Link>
                <div className="flex items-center space-x-2 text-gray-700">
                  <User className="h-4 w-4" />
                  <span className="font-medium">
                    {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <>
                <Link 
                  href="/auth/login"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Login
                </Link>
                <Link 
                  href="/auth/register"
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Create Custom Songs with AI
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Turn your memories into music. Generate personalized songs for birthdays, 
          anniversaries, weddings, and any special moment that deserves its own soundtrack.
        </p>
        <Link 
          href="/create"
          className="bg-purple-600 text-white px-10 py-5 rounded-lg text-lg font-semibold hover:bg-purple-700 transition-colors inline-block"
        >
          Create Your Song Now
        </Link>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Perfect for Every Occasion
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <Heart className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Romantic Moments</h3>
            <p className="text-gray-600">
              Anniversaries, proposals, Valentine&apos;s Day, or just because you love them.
            </p>
          </div>
          <div className="text-center p-6">
            <Gift className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Special Celebrations</h3>
            <p className="text-gray-600">
              Birthdays, graduations, promotions, or any milestone worth celebrating.
            </p>
          </div>
          <div className="text-center p-6">
            <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Family & Friends</h3>
            <p className="text-gray-600">
              Create memories with personalized songs for the people who matter most.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">1</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Answer Questions</h3>
              <p className="text-gray-600">Tell us about the recipient and occasion</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">2</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Choose Style</h3>
              <p className="text-gray-600">Select genre, mood, and preferences</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">AI Creates</h3>
              <p className="text-gray-600">Our AI generates your custom song</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">4</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Download & Share</h3>
              <p className="text-gray-600">Get your song and share the magic</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Simple Pricing
        </h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          <div className="bg-white p-8 rounded-lg shadow-lg border-2 border-gray-200">
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Single Song</h3>
            <div className="text-4xl font-bold text-purple-600 mb-4">$9.99</div>
            <ul className="space-y-2 text-gray-600">
              <li>✓ Custom AI-generated song</li>
              <li>✓ High-quality audio download</li>
              <li>✓ Personalized lyrics</li>
              <li>✓ Multiple genre options</li>
            </ul>
            <Link 
              href="/create"
              className="w-full bg-purple-600 text-white py-4 rounded-lg mt-6 block text-center hover:bg-purple-700 transition-colors"
            >
              Create Song
            </Link>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-lg border-2 border-purple-500">
            <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm inline-block mb-2">
              Best Value
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900">3-Song Bundle</h3>
            <div className="text-4xl font-bold text-purple-600 mb-1">$24.99</div>
            <div className="text-gray-500 mb-4">$8.33 per song</div>
            <ul className="space-y-2 text-gray-600">
              <li>✓ 3 custom AI-generated songs</li>
              <li>✓ High-quality audio downloads</li>
              <li>✓ Personalized lyrics for each</li>
              <li>✓ Multiple genre options</li>
              <li>✓ Save $5.00</li>
            </ul>
            <Link 
              href="/create?bundle=3"
              className="w-full bg-purple-600 text-white py-4 rounded-lg mt-6 block text-center hover:bg-purple-700 transition-colors"
            >
              Get Bundle
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <Music className="h-6 w-6" />
              <span className="text-lg font-semibold">SongCreator</span>
            </div>
            
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
              <Link 
                href="/support" 
                className="text-gray-300 hover:text-white transition-colors"
              >
                Support
              </Link>
              <a 
                href="mailto:appspire@icloud.com"
                className="text-gray-300 hover:text-white transition-colors"
              >
                appspire@icloud.com
              </a>
            </div>
            
            <div className="text-gray-400 text-center md:text-right">
              © 2024 SongCreator. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}