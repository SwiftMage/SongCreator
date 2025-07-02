'use client'

import Link from "next/link";
import { Check, ArrowLeft, Loader2 } from "lucide-react";
import Logo from "@/components/Logo";
import DarkModeToggle from "@/components/DarkModeToggle";
import { useState } from "react";
import { createCheckoutSession } from '@/lib/stripe';

export default function PricingPage() {
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<'single' | 'bundle3' | 'bundle5' | null>(null);

  const handleCheckout = async (type: 'single' | 'bundle3' | 'bundle5') => {
    try {
      setIsCheckoutLoading(type);
      // Note: Form data and step are already preserved in sessionStorage from create page
      // No need to save additional data here - just proceed with checkout
      await createCheckoutSession(type);
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to create checkout session. Please try again.');
    } finally {
      setIsCheckoutLoading(null);
    }
  };
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
                href="/dashboard"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center space-x-2 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-4">
            Create and refine amazing personalized songs with our flexible credit system.
          </p>
          <div className="bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg p-4 max-w-xl mx-auto">
            <p className="text-purple-800 dark:text-purple-300 font-medium">
              ✨ 1 credit to generate a new song or modify an existing song!
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Starter Pack */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-lg p-8 border-2 border-gray-200 dark:border-gray-700 transition-all hover:shadow-xl flex flex-col">
            <div className="flex-grow">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Starter Pack</h3>
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-6">$9.99</div>
              {/* <div className="text-gray-500 dark:text-gray-400 mb-6">$2.00 per credit</div> */}
              <ul className="space-y-3 text-gray-600 dark:text-gray-300 mb-8">
              <li className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="font-medium text-purple-600">5 credits included</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">AI lyric and music generation</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">Step-by-step creation guide</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">High-quality MP3 audio files</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">Two songs created per credit</span>
              </li>
              </ul>
            </div>
            <button 
              onClick={() => handleCheckout('single')}
              disabled={isCheckoutLoading === 'single'}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCheckoutLoading === 'single' ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Get Starter Pack'
              )}
            </button>
          </div>

          {/* Pro Pack */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl shadow-lg p-8 border-2 border-purple-500 dark:border-purple-400 relative transition-all hover:shadow-xl flex flex-col">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-gradient-to-r from-[#00f5ff] via-[#ff006e] to-[#8338ec] text-white px-4 py-1.5 rounded-full text-sm font-semibold">
                MOST POPULAR
              </div>
            </div>
            <div className="flex-grow">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Pro Pack</h3>
              <div className="text-4xl font-bold bg-gradient-to-r from-[#00f5ff] via-[#ff006e] to-[#8338ec] bg-clip-text text-transparent mb-6">$24.99</div>
              {/* <div className="text-gray-600 dark:text-gray-400 mb-6">$1.67 per credit</div> */}
              <ul className="space-y-3 text-gray-600 dark:text-gray-300 mb-8">
              <li className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="font-medium text-purple-600">15 credits included</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">AI lyric and music generation</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">Step-by-step creation guide</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">High-quality MP3 audio files</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">Two songs created per credit</span>
              </li>
              </ul>
            </div>
            <button 
              onClick={() => handleCheckout('bundle3')}
              disabled={isCheckoutLoading === 'bundle3'}
              className="relative w-full py-4 text-white font-semibold rounded-xl overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#00f5ff] via-[#ff006e] to-[#8338ec] transition-transform group-hover:scale-110" />
              <span className="relative flex items-center justify-center gap-2">
                {isCheckoutLoading === 'bundle3' ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Get Pro Pack'
                )}
              </span>
            </button>
          </div>

          {/* Mega Pack */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-lg p-8 border-2 border-gray-200 dark:border-gray-700 transition-all hover:shadow-xl flex flex-col">
            <div className="flex-grow">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Mega Pack</h3>
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-6">$39.99</div>
              {/* <div className="text-gray-500 dark:text-gray-400 mb-6">$1.33 per credit</div> */}
              <ul className="space-y-3 text-gray-600 dark:text-gray-300 mb-8">
              <li className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="font-medium text-purple-600">30 credits included</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">AI lyric and music generation</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">Step-by-step creation guide</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">High-quality MP3 audio files</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">Two songs created per credit</span>
              </li>
              </ul>
            </div>
            <button 
              onClick={() => handleCheckout('bundle5')}
              disabled={isCheckoutLoading === 'bundle5'}
              className="w-full py-4 text-gray-900 dark:text-white font-semibold rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCheckoutLoading === 'bundle5' ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Get Mega Pack'
              )}
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                How do credits work?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Simple: 1 credit to generate a new song, or 1 credit to modify an existing song. 
                This gives you maximum flexibility to create and perfect your songs.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                How long does it take to generate a song?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Song generation usually takes about 1 minute. 
                You&apos;ll receive an email notification when your song is ready.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Can I modify my song after it's created?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes! You can regenerate the music, update the lyrics, or change your song description 
                and create a new version. Each modification uses 1 credit, giving you complete creative control.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Do credits expire?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                No! Your credits never expire. Use them whenever you&apos;re ready to 
                create or refine your songs.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                What audio format will I receive?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                You get a high-quality MP3 file that you can download and share anywhere.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}