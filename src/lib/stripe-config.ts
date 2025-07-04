/**
 * Stripe Configuration Utility
 * Automatically switches between test and production Stripe settings based on NODE_ENV
 */

const isProduction = process.env.NODE_ENV === 'production';

// Stripe API Keys (auto-switching)
export const getStripeKeys = () => {
  if (isProduction) {
    return {
      publishableKey: process.env.STRIPE_LIVE_PUBLISHABLE_KEY!,
      secretKey: process.env.STRIPE_LIVE_SECRET_KEY!,
    };
  } else {
    return {
      publishableKey: process.env.STRIPE_TEST_PUBLISHABLE_KEY!,
      secretKey: process.env.STRIPE_TEST_SECRET_KEY!,
    };
  }
};

// Stripe Product IDs (auto-switching)
export const getStripeProductIds = () => {
  if (isProduction) {
    return {
      // Monthly Subscriptions
      lite: process.env.STRIPE_LIVE_LITE_PRODUCT_ID!,
      plus: process.env.STRIPE_LIVE_PLUS_PRODUCT_ID!,
      max: process.env.STRIPE_LIVE_MAX_PRODUCT_ID!,
      
      // One-Time Purchases
      starter: process.env.STRIPE_LIVE_STARTER_PRODUCT_ID!,
      creator: process.env.STRIPE_LIVE_CREATOR_PRODUCT_ID!,
      pro: process.env.STRIPE_LIVE_PRO_PRODUCT_ID!,
    };
  } else {
    return {
      // Monthly Subscriptions
      lite: process.env.STRIPE_TEST_LITE_PRODUCT_ID!,
      plus: process.env.STRIPE_TEST_PLUS_PRODUCT_ID!,
      max: process.env.STRIPE_TEST_MAX_PRODUCT_ID!,
      
      // One-Time Purchases
      starter: process.env.STRIPE_TEST_STARTER_PRODUCT_ID!,
      creator: process.env.STRIPE_TEST_CREATOR_PRODUCT_ID!,
      pro: process.env.STRIPE_TEST_PRO_PRODUCT_ID!,
    };
  }
};

// Environment info
export const stripeEnvironment = {
  isProduction,
  mode: isProduction ? 'live' : 'test',
  keyPrefix: isProduction ? 'pk_live_' : 'pk_test_',
};

// Validation function to ensure all required environment variables are present
export const validateStripeConfig = () => {
  const keys = getStripeKeys();
  const productIds = getStripeProductIds();
  
  const missing: string[] = [];
  
  // Check API keys
  if (!keys.publishableKey) {
    missing.push(isProduction ? 'STRIPE_LIVE_PUBLISHABLE_KEY' : 'STRIPE_TEST_PUBLISHABLE_KEY');
  }
  if (!keys.secretKey) {
    missing.push(isProduction ? 'STRIPE_LIVE_SECRET_KEY' : 'STRIPE_TEST_SECRET_KEY');
  }
  
  // Check product IDs
  const productIdKeys = Object.keys(productIds) as (keyof typeof productIds)[];
  productIdKeys.forEach(key => {
    if (!productIds[key]) {
      const envVar = isProduction 
        ? `STRIPE_LIVE_${key.toUpperCase()}_PRODUCT_ID`
        : `STRIPE_TEST_${key.toUpperCase()}_PRODUCT_ID`;
      missing.push(envVar);
    }
  });
  
  if (missing.length > 0) {
    throw new Error(`Missing Stripe environment variables for ${stripeEnvironment.mode} mode: ${missing.join(', ')}`);
  }
  
  return true;
};