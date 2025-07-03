-- Add missing Stripe columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_plan_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS billing_cycle_anchor timestamp with time zone;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS next_billing_date timestamp with time zone;

-- Add unique constraint on stripe_subscription_id
ALTER TABLE profiles ADD CONSTRAINT unique_stripe_subscription_id UNIQUE (stripe_subscription_id);

-- Add check constraint for subscription_status to include new tiers
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_status_check 
  CHECK (subscription_status IN ('free', 'lite', 'plus', 'max', 'pro', 'premium', 'enterprise', 'cancelled'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS profiles_stripe_customer_id_idx ON profiles(stripe_customer_id);