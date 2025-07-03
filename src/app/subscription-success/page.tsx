'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';
import DarkModeToggle from '@/components/DarkModeToggle';
import { Check, ArrowRight, CreditCard, Zap } from 'lucide-react';

function SubscriptionSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      router.push('/pricing');
      return;
    }

    // Verify the subscription was created successfully
    const verifySubscription = async () => {
      try {
        const response = await fetch(`/api/verify-subscription?session_id=${sessionId}`);
        const data = await response.json();
        
        if (data.success) {
          setSubscriptionDetails(data.subscription);
        } else {
          console.error('Subscription verification failed:', data.error);
        }
      } catch (error) {
        console.error('Error verifying subscription:', error);
      } finally {
        setIsLoading(false);
      }
    };

    verifySubscription();
  }, [sessionId, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Confirming your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl max-w-md w-full text-center relative">
        <div className="absolute top-4 right-4">
          <DarkModeToggle />
        </div>
        
        <div className="mb-6">
          <Logo className="mx-auto mb-4" />
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome to Song Mint!
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Your subscription is now active and you're ready to start creating amazing songs.
        </p>

        {subscriptionDetails && (
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
              <CreditCard className="w-4 h-4 mr-2" />
              Subscription Details
            </h3>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <p><strong>Plan:</strong> {subscriptionDetails.planName}</p>
              <p><strong>Credits per month:</strong> {subscriptionDetails.creditsPerMonth}</p>
              <p><strong>Next billing:</strong> {subscriptionDetails.nextBilling}</p>
              <p><strong>Amount:</strong> ${subscriptionDetails.amount}/month</p>
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          <Link
            href="/create"
            className="block w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg px-4 py-3 font-medium hover:opacity-90 transition-opacity flex items-center justify-center"
          >
            <Zap className="w-4 h-4 mr-2" />
            Create Your First Song
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
          
          <Link
            href="/dashboard"
            className="block w-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Need help getting started? Check out our{' '}
            <Link href="/support" className="text-purple-600 dark:text-purple-400 hover:underline">
              support center
            </Link>
            {' '}or manage your subscription in your{' '}
            <Link href="/dashboard" className="text-purple-600 dark:text-purple-400 hover:underline">
              dashboard
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <SubscriptionSuccessContent />
    </Suspense>
  )
}