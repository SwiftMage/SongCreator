import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
export const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Pricing configuration
export const PRICING = {
  single: {
    id: 'starter_pack',
    name: 'Starter Pack',
    price: 999, // $9.99 in cents
    credits: 5,
  },
  bundle3: {
    id: 'pro_pack', 
    name: 'Pro Pack',
    price: 2499, // $24.99 in cents
    credits: 15,
  },
  bundle5: {
    id: 'mega_pack',
    name: 'Mega Pack', 
    price: 3999, // $39.99 in cents
    credits: 30,
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
export async function createSubscriptionCheckout(planId: 'lite' | 'plus' | 'pro-monthly') {
  try {
    const response = await fetch('/api/create-subscription-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Subscription checkout error:', errorData);
      throw new Error(errorData.details || errorData.error || 'Failed to create subscription checkout');
    }

    const { url, redirectToPortal } = await response.json();
    
    if (url) {
      // Redirect to Stripe Checkout or Customer Portal
      window.location.href = url;
    }

    return { redirectToPortal };
  } catch (error) {
    console.error('Error creating subscription checkout:', error);
    throw error;
  }
}