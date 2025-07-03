import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
export const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Pricing configuration
export const PRICING = {
  single: {
    id: 'starter_pack',
    name: 'Starter',
    price: 900, // $9.00 in cents
    credits: 3,
  },
  bundle3: {
    id: 'creator_pack', 
    name: 'Creator',
    price: 1900, // $19.00 in cents
    credits: 10,
  },
  bundle5: {
    id: 'pro_pack',
    name: 'Pro', 
    price: 2900, // $29.00 in cents
    credits: 20,
  },
};

// Create checkout session
export async function createCheckoutSession(bundleType: 'single' | 'bundle3' | 'bundle5') {
  const bundle = PRICING[bundleType];
  
  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId: bundle.price,
        credits: bundle.credits,
        bundleName: bundle.name,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Checkout session error:', errorData);
      throw new Error(errorData.details || errorData.error || 'Failed to create checkout session');
    }

    const { url } = await response.json();
    
    if (url) {
      // Redirect to Stripe Checkout
      window.location.href = url;
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

// Create subscription checkout session
export async function createSubscriptionCheckout(planId: 'lite' | 'plus' | 'max') {
  try {
    console.log('Creating subscription checkout for plan:', planId);
    
    const response = await fetch('/api/create-subscription-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId,
      }),
    });

    console.log('Subscription checkout response status:', response.status);
    console.log('Subscription checkout response headers:', response.headers);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Subscription checkout error response:', {
        status: response.status,
        statusText: response.statusText,
        errorData: errorData
      });
      throw new Error(errorData.details || errorData.error || 'Failed to create subscription checkout');
    }

    const responseData = await response.json();
    console.log('Subscription checkout success response:', responseData);
    
    const { url, redirectToPortal } = responseData;
    
    if (url) {
      console.log('Redirecting to:', url);
      // Redirect to Stripe Checkout or Customer Portal
      window.location.href = url;
    }

    return { redirectToPortal };
  } catch (error) {
    console.error('Error creating subscription checkout:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}