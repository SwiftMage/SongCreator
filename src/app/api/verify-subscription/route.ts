import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerComponentClient } from '@/lib/supabase/server';
import { getStripeKeys, getStripeProductIds } from '@/lib/stripe-config';

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

// Get plan details dynamically
const getPlanDetails = () => {
  const productIds = getStripeProductIds();
  return {
    [productIds.lite]: { name: 'Lite', credits: 5 },
    [productIds.plus]: { name: 'Plus', credits: 15 },
    [productIds.max]: { name: 'Max', credits: 30 },
  };
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session ID' }, { status: 400 });
    }

    // Get the current user
    const supabase = await createServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Stripe instance and plan details
    const stripeInstance = getStripe();
    const planDetails = getPlanDetails();
    
    // Retrieve the checkout session from Stripe
    const session = await stripeInstance.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'subscription.items.data.price.product']
    });

    if (session.customer_email !== user.email) {
      return NextResponse.json({ error: 'Session does not belong to user' }, { status: 403 });
    }

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ 
        success: false, 
        error: 'Payment not completed' 
      }, { status: 400 });
    }

    // Get subscription details
    const subscription = session.subscription as Stripe.Subscription;
    if (!subscription) {
      return NextResponse.json({ 
        success: false, 
        error: 'No subscription found' 
      }, { status: 400 });
    }

    const productId = subscription.items.data[0].price.product as string;
    const productPlanDetails = planDetails[productId];

    if (!productPlanDetails) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unknown product' 
      }, { status: 400 });
    }

    // Return subscription details
    return NextResponse.json({
      success: true,
      subscription: {
        planName: productPlanDetails.name,
        creditsPerMonth: productPlanDetails.credits,
        amount: (subscription.items.data[0].price.unit_amount! / 100).toFixed(2),
        nextBilling: new Date((subscription as any).current_period_end * 1000).toLocaleDateString(),
        status: subscription.status
      }
    });

  } catch (error) {
    console.error('Error verifying subscription:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to verify subscription' 
      },
      { status: 500 }
    );
  }
}