import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerComponentClient } from '@/lib/supabase/server';
import { getStripeKeys, validateStripeConfig } from '@/lib/stripe-config';

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

export async function POST(request: Request) {
  try {
    const { priceId, credits, bundleName } = await request.json();
    
    // Validate Stripe configuration
    try {
      validateStripeConfig();
    } catch (configError) {
      console.error('Stripe configuration error:', configError);
      return NextResponse.json({ error: 'Payment service temporarily unavailable' }, { status: 500 });
    }
    
    // Get the current user
    const supabase = await createServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Stripe instance and create checkout session
    const stripeInstance = getStripe();
    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: bundleName,
              description: `${credits} song creation credit${credits > 1 ? 's' : ''} for Song Mint`,
            },
            unit_amount: priceId, // Price in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_creation: 'if_required',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&credits=${credits}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      customer_email: user.email,
      automatic_tax: {
        enabled: true,
      },
      metadata: {
        userId: user.id,
        credits: credits.toString(),
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    
    // Log more details in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Full error details:', {
        message: errorMessage,
        stack: errorStack,
        error: error
      });
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}