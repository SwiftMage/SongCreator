import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerComponentClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// Map plan IDs to Stripe product IDs (from your Stripe dashboard)
const SUBSCRIPTION_PRODUCTS: Record<string, { productId: string; name: string }> = {
  'lite': { productId: 'prod_Sc17KxGFrbExyC', name: 'Lite' },
  'plus': { productId: 'prod_Sc17XcZXJ7uh7u', name: 'Plus' },  
  'max': { productId: 'prod_Sc18pmjLNU5OWN', name: 'Max' },
};

export async function POST(request: Request) {
  try {
    const { planId } = await request.json();
    
    console.log('Creating subscription checkout for plan:', planId);
    
    // Get the current user
    const supabase = await createServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile to check for existing subscription
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, stripe_subscription_id, email')
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

    // Get the Stripe product info for this plan
    const productInfo = SUBSCRIPTION_PRODUCTS[planId];
    if (!productInfo) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    // Get the default price for this product
    const product = await stripe.products.retrieve(productInfo.productId, {
      expand: ['default_price']
    });
    
    const defaultPrice = product.default_price;
    if (!defaultPrice || typeof defaultPrice === 'string') {
      return NextResponse.json({ error: 'Product price not found' }, { status: 400 });
    }

    let customerId = profile.stripe_customer_id;

    // Create or retrieve Stripe customer
    if (!customerId) {
      const customer = await stripe.customers.create({
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
          stripe_customer_id: customerId,
          email: user.email 
        })
        .eq('id', user.id);
    }

    // Check if user already has an active subscription
    if (profile.stripe_subscription_id) {
      // User wants to change subscription - redirect to customer portal
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      });

      return NextResponse.json({ 
        redirectToPortal: true, 
        url: portalSession.url 
      });
    }

    // Create subscription checkout session
    const session = await stripe.checkout.sessions.create({
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
      tax_id_collection: {
        enabled: true,
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