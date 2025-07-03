-- Add subscription tracking fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_plan_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS billing_cycle_anchor timestamp with time zone;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS next_billing_date timestamp with time zone;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;

-- Add unique constraint on stripe_subscription_id
ALTER TABLE profiles ADD CONSTRAINT unique_stripe_subscription_id UNIQUE (stripe_subscription_id);

-- Add check constraint for subscription_status to include new tiers
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_status_check 
  CHECK (subscription_status IN ('free', 'lite', 'plus', 'max', 'pro', 'premium', 'enterprise', 'cancelled'));

-- Create billing_history table
CREATE TABLE IF NOT EXISTS billing_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount decimal(10,2) NOT NULL,
  credits_added integer NOT NULL,
  stripe_invoice_id text NOT NULL,
  stripe_subscription_id text NOT NULL,
  billing_period_start timestamp with time zone NOT NULL,
  billing_period_end timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies for billing_history
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own billing history" ON billing_history
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert billing records
CREATE POLICY "Service role can insert billing history" ON billing_history
  FOR INSERT WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS billing_history_user_id_idx ON billing_history(user_id);
CREATE INDEX IF NOT EXISTS billing_history_stripe_subscription_id_idx ON billing_history(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS billing_history_created_at_idx ON billing_history(created_at DESC);
CREATE INDEX IF NOT EXISTS profiles_stripe_customer_id_idx ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);

-- Function to update user credits securely (enhanced for subscriptions)
CREATE OR REPLACE FUNCTION update_user_credits(
  target_user_id uuid,
  credit_change integer,
  operation_type text DEFAULT 'subscription_billing'
) RETURNS void AS $$
DECLARE
  current_credits integer;
  new_credits integer;
BEGIN
  -- Get current credits with row lock
  SELECT credits_remaining INTO current_credits
  FROM profiles
  WHERE id = target_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', target_user_id;
  END IF;

  -- Calculate new credit total
  new_credits := current_credits + credit_change;

  -- Ensure credits don't go below 0 or above 10000
  IF new_credits < 0 THEN
    RAISE EXCEPTION 'Insufficient credits. Current: %, Requested: %', current_credits, ABS(credit_change);
  END IF;

  IF new_credits > 10000 THEN
    RAISE EXCEPTION 'Credit limit exceeded. Maximum allowed: 10000';
  END IF;

  -- Update credits
  UPDATE profiles
  SET credits_remaining = new_credits
  WHERE id = target_user_id;

  -- Log to audit table if it exists
  INSERT INTO audit_log (
    table_name,
    operation,
    old_data,
    new_data,
    user_id
  ) VALUES (
    'profiles',
    operation_type,
    jsonb_build_object('credits_remaining', current_credits),
    jsonb_build_object('credits_remaining', new_credits),
    target_user_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Credit update failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION update_user_credits TO service_role;