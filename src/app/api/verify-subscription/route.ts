import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerComponentClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const PLAN_DETAILS: Record<string, { name: string; credits: number }> = {
  'prod_Sc17KxGFrbExyC': { name: 'Lite', credits: 5 },
  'prod_Sc17XcZXJ7uh7u': { name: 'Plus', credits: 15 },
  'prod_Sc18pmjLNU5OWN': { name: 'Max', credits: 30 },
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

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
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
    const planDetails = PLAN_DETAILS[productId];

    if (!planDetails) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unknown product' 
      }, { status: 400 });
    }

    // Return subscription details
    return NextResponse.json({
      success: true,
      subscription: {
        planName: planDetails.name,
        creditsPerMonth: planDetails.credits,
        amount: (subscription.items.data[0].price.unit_amount! / 100).toFixed(2),
        nextBilling: new Date(subscription.current_period_end * 1000).toLocaleDateString(),
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