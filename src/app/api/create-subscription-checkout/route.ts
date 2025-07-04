import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerComponentClient } from '@/lib/supabase/server';
import { getStripeKeys, getStripeProductIds, validateStripeConfig, stripeEnvironment } from '@/lib/stripe-config';

// Initialize Stripe lazily to avoid build-time issues
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

// Get subscription products lazily
const getSubscriptionProducts = () => {
  const productIds = getStripeProductIds();
  return {
    'lite': { productId: productIds.lite, name: 'Lite' },
    'plus': { productId: productIds.plus, name: 'Plus' },  
    'max': { productId: productIds.max, name: 'Max' },
  };
};

export async function POST(request: Request) {
  try {
    const { planId } = await request.json();
    
    console.log('Creating subscription checkout for plan:', planId, 'in', stripeEnvironment.mode, 'mode');
    
    // Validate Stripe configuration
    try {
      validateStripeConfig();
    } catch (configError) {
      console.error('Stripe configuration error:', configError);
      return NextResponse.json({ error: 'Subscription service temporarily unavailable' }, { status: 500 });
    }
    
    // Get the current user
    const supabase = await createServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile to check for existing subscription
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Failed to get user profile:', profileError);
      if (profileError.code === 'PGRST116') {
        return NextResponse.json({ 
          error: 'User profile not found. Please log out and log back in to complete your profile setup.' 
        }, { status: 404 });
      }
      return NextResponse.json({ error: 'User profile error' }, { status: 500 });
    }

    // Get Stripe instance and subscription products
    const stripeInstance = getStripe();
    const subscriptionProducts = getSubscriptionProducts();
    
    // Get the Stripe product info for this plan
    const productInfo = subscriptionProducts[planId as keyof typeof subscriptionProducts];
    if (!productInfo) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    // Get the default price for this product
    const product = await stripeInstance.products.retrieve(productInfo.productId, {
      expand: ['default_price']
    });
    
    const defaultPrice = product.default_price;
    if (!defaultPrice || typeof defaultPrice === 'string') {
      return NextResponse.json({ error: 'Product price not found' }, { status: 400 });
    }

    let customerId = profile.stripe_customer_id;

    // Create or retrieve Stripe customer
    if (!customerId) {
      const customer = await stripeInstance.customers.create({
        email: user.email!,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;

      // Update profile with customer ID
      await supabase
        .from('profiles')
        .update({ 
          stripe_customer_id: customerId
        })
        .eq('id', user.id);
    }

    // Check if user already has an active subscription
    if (profile.stripe_subscription_id) {
      // User wants to change subscription - redirect to customer portal
      const portalSession = await stripeInstance.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      });

      return NextResponse.json({ 
        redirectToPortal: true, 
        url: portalSession.url 
      });
    }

    // Create subscription checkout session
    const session = await stripeInstance.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: defaultPrice.id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      subscription_data: {
        metadata: {
          userId: user.id,
          planId: planId,
        },
      },
      customer_update: {
        address: 'auto',
      },
      automatic_tax: {
        enabled: true,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating subscription checkout session:', error);
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
        error: 'Failed to create subscription checkout session',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}