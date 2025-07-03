'use client'

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";
import DarkModeToggle from "@/components/DarkModeToggle";
import PricingToggle from "@/components/PricingToggle";
import { useState } from "react";
import { createCheckoutSession } from '@/lib/stripe';

export default function PricingPage() {
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<string | null>(null);

  const handleCheckout = async (planId: string) => {
    try {
      setIsCheckoutLoading(planId);
      
      // Map new plan IDs to existing checkout types
      // TODO: Update createCheckoutSession to handle new pricing structure
      let checkoutType: 'single' | 'bundle3' | 'bundle5';
      
      switch (planId) {
        case 'starter':
          checkoutType = 'single'; // Will need to update for 3 credits
          break;
        case 'creator':
          checkoutType = 'bundle3'; // Will need to update for 10 credits
          break;
        case 'pro':
          checkoutType = 'bundle5'; // Will need to update for 20 credits
          break;
        // Monthly plans will need new handling
        case 'lite':
        case 'plus':
        case 'pro-monthly':
          alert('Monthly subscriptions coming soon!');
          setIsCheckoutLoading(null);
          return;
        default:
          checkoutType = 'single';
      }
      
      await createCheckoutSession(checkoutType);
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
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-4">
            Create personalized AI-powered songs for any occasion
          </p>
          <div className="bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg p-4 max-w-xl mx-auto">
            <p className="text-purple-800 dark:text-purple-300 font-medium">
              ✨ 1 credit = 1 song creation or modification
            </p>
          </div>
        </div>

        {/* Pricing Section with Background */}
        <div className="relative">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-purple-50/50 to-transparent dark:from-purple-900/10 dark:to-transparent rounded-3xl -z-10" />
          
          {/* Pricing Toggle Component */}
          <PricingToggle 
            onCheckout={handleCheckout}
            isCheckoutLoading={isCheckoutLoading}
          />
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
                For one-time purchases: Credits never expire - use them whenever you want!<br />
                For subscriptions: Unused credits roll over to the next month, so you never lose them.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                What&apos;s the difference between one-time and subscription?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                One-time purchases are perfect for occasional use - buy credits when you need them. 
                Subscriptions offer better value if you create songs regularly, plus unused credits roll over each month.
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