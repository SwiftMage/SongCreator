'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { ensureUserProfile } from '@/lib/profile-utils';
import DarkModeToggle from '@/components/DarkModeToggle';

export default function EmailVerified() {
  const router = useRouter();
  const [profileStatus, setProfileStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [error, setError] = useState('');
  const supabase = createClient();

  useEffect(() => {
    const setupUserProfile = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error('No authenticated user found:', userError);
          setError('Authentication required. Please log in.');
          setProfileStatus('error');
          return;
        }

        // Ensure user has a profile
        const profileResult = await ensureUserProfile(user);
        
        if (!profileResult.success) {
          console.error('Profile setup failed:', profileResult.error);
          setError(profileResult.error || 'Failed to set up user profile');
          setProfileStatus('error');
          return;
        }

        console.log('Profile setup successful for user:', user.id);
        setProfileStatus('success');

        // Redirect to dashboard after 3 seconds
        const timeout = setTimeout(() => {
          router.push('/dashboard');
        }, 3000);

        return () => clearTimeout(timeout);

      } catch (err) {
        console.error('Unexpected error during profile setup:', err);
        setError('An unexpected error occurred during setup');
        setProfileStatus('error');
      }
    };

    setupUserProfile();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl max-w-md w-full text-center relative">
        <div className="absolute top-4 right-4">
          <DarkModeToggle />
        </div>
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {profileStatus === 'checking' ? 'Setting up your account...' : 
           profileStatus === 'success' ? 'Account ready!' :
           'Setup Error'}
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {profileStatus === 'checking' ? 'Your email has been verified. We\'re setting up your profile...' :
           profileStatus === 'success' ? 'Your account is ready! Redirecting to your dashboard...' :
           `Setup failed: ${error}`}
        </p>
        
        <div className="space-y-3">
          {profileStatus === 'success' && (
            <Link
              href="/dashboard"
              className="block w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg px-4 py-3 font-medium hover:opacity-90 transition-opacity"
            >
              Go to Dashboard
            </Link>
          )}
          
          {profileStatus === 'error' && (
            <Link
              href="/auth"
              className="block w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg px-4 py-3 font-medium hover:opacity-90 transition-opacity"
            >
              Try Logging In Again
            </Link>
          )}
          
          <Link
            href="/"
            className="block w-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}