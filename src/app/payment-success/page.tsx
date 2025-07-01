'use client'

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Loader2, Music } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import Logo from '@/components/Logo';
import DarkModeToggle from '@/components/DarkModeToggle';

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const supabase = createClient();

  useEffect(() => {
    const processPayment = async () => {
      const sessionId = searchParams.get('session_id');
      const creditsParam = searchParams.get('credits');
      
      if (!sessionId || !creditsParam) {
        setError('Invalid payment session');
        setIsProcessing(false);
        return;
      }

      try {
        const creditsToAdd = parseInt(creditsParam);
        setCredits(creditsToAdd);

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          setError('Authentication required');
          router.push('/auth');
          return;
        }

        // Update user credits
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('credits_remaining')
          .eq('id', user.id)
          .single();

        if (profileError) {
          setError('Failed to retrieve profile');
          setIsProcessing(false);
          return;
        }

        const newCredits = (profile.credits_remaining || 0) + creditsToAdd;

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ credits_remaining: newCredits })
          .eq('id', user.id);

        if (updateError) {
          setError('Failed to update credits');
          setIsProcessing(false);
          return;
        }

        // Success!
        setIsProcessing(false);
      } catch (err) {
        console.error('Payment processing error:', err);
        setError('An error occurred processing your payment');
        setIsProcessing(false);
      }
    };

    processPayment();
  }, [searchParams, router, supabase]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-gray-950/80 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo />
            <DarkModeToggle />
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-24">
        <div className="max-w-2xl mx-auto">
          {isProcessing ? (
            <div className="text-center">
              <Loader2 className="h-16 w-16 animate-spin text-[#ff006e] mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Processing Your Payment...
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Please wait while we confirm your purchase and add credits to your account.
              </p>
            </div>
          ) : error ? (
            <div className="text-center">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Payment Error
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                {error}
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Try Again
              </Link>
            </div>
          ) : (
            <div className="text-center">
              <div className="relative inline-block mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-[#00f5ff] via-[#ff006e] to-[#8338ec] blur-2xl opacity-50" />
                <CheckCircle className="h-20 w-20 text-green-500 relative" />
              </div>
              
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Payment Successful!
              </h1>
              
              <div className="bg-gradient-to-r from-[#00f5ff]/10 via-[#ff006e]/10 to-[#8338ec]/10 dark:from-[#00f5ff]/20 dark:via-[#ff006e]/20 dark:to-[#8338ec]/20 rounded-2xl p-8 mb-8">
                <p className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  {credits} Credit{credits > 1 ? 's' : ''} Added!
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Your credits have been added to your account and are ready to use.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/create"
                  className="relative px-8 py-4 text-white font-semibold rounded-xl overflow-hidden group transform transition-all hover:scale-105"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-[#00f5ff] via-[#ff006e] to-[#8338ec] transition-transform group-hover:scale-110" />
                  <span className="relative flex items-center justify-center gap-2">
                    <Music className="h-5 w-5" />
                    Create Your First Song
                  </span>
                </Link>
                
                <Link
                  href="/dashboard"
                  className="px-8 py-4 text-gray-700 dark:text-gray-300 font-semibold rounded-xl border-2 border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 transition-all"
                >
                  Go to Dashboard
                </Link>
              </div>

              <p className="mt-8 text-sm text-gray-500 dark:text-gray-500">
                A confirmation email has been sent to your registered email address.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}