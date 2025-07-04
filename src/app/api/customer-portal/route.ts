import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerComponentClient } from '@/lib/supabase/server';
import { getStripeKeys } from '@/lib/stripe-config';

// Initialize Stripe lazily
let stripe: Stripe | null = null;
const getStripe = () => {
  if (!stripe) {
    const stripeKeys = getStripeKeys();
    stripe = new Stripe(stripeKeys.secretKey, {
      apiVersion: '2025-05-28.basil',
    });
  }
  return stripe;
};

export async function POST() {
  try {
    // Get the current user
    const supabase = await createServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile with Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !profile.stripe_customer_id) {
      return NextResponse.json({ error: 'No customer found' }, { status: 404 });
    }

    // Create customer portal session
    const stripeInstance = getStripe();
    const portalSession = await stripeInstance.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create customer portal session' },
      { status: 500 }
    );
  }
}