-- CRITICAL Security Fixes Migration
-- Run this in Supabase SQL Editor IMMEDIATELY

-- ============================================================================
-- 1. FIX CRITICAL PRIVACY BREACH - Profile Visibility
-- ============================================================================

-- Remove the dangerous public profile policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;

-- Create secure policy - users can only see their own profile
CREATE POLICY "Users can view own profile only" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- ============================================================================
-- 2. ADD MISSING DELETE POLICIES
-- ============================================================================

-- Allow users to delete their own orders
CREATE POLICY "Users can delete own orders" ON orders
  FOR DELETE USING (auth.uid() = user_id);

-- Note: Songs delete policy already exists from previous migration

-- ============================================================================
-- 3. ADD DATA INTEGRITY CONSTRAINTS
-- ============================================================================

-- Ensure critical fields cannot be NULL
ALTER TABLE profiles 
ALTER COLUMN subscription_status SET NOT NULL,
ALTER COLUMN credits_remaining SET NOT NULL;

-- Add validation for subscription status (with safe constraint addition)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'valid_subscription_status' 
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT valid_subscription_status 
    CHECK (subscription_status IN ('free', 'pro', 'premium', 'enterprise'));
  END IF;
END $$;

-- Prevent negative credits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'positive_credits' 
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT positive_credits 
    CHECK (credits_remaining >= 0);
  END IF;
END $$;

-- Add reasonable credit limit (prevent abuse)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'max_credits' 
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT max_credits 
    CHECK (credits_remaining <= 10000);
  END IF;
END $$;

-- Ensure order amounts are positive
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'positive_amount' 
    AND table_name = 'orders'
  ) THEN
    ALTER TABLE orders
    ADD CONSTRAINT positive_amount
    CHECK (amount > 0);
  END IF;
END $$;

-- Validate order status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'valid_order_status' 
    AND table_name = 'orders'
  ) THEN
    ALTER TABLE orders
    ADD CONSTRAINT valid_order_status
    CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled'));
  END IF;
END $$;

-- ============================================================================
-- 4. ENHANCED PROFILE UPDATE SECURITY
-- ============================================================================

-- Remove the basic update policy
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;

-- Create more secure update policy that prevents users from modifying credits/subscription
CREATE POLICY "Users can update own profile basic info" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Prevent users from directly modifying financial data
    credits_remaining = (SELECT credits_remaining FROM profiles WHERE id = auth.uid()) AND
    subscription_status = (SELECT subscription_status FROM profiles WHERE id = auth.uid())
  );

-- Separate policy for service role to update credits (for API operations)
CREATE POLICY "Service role can update credits and subscription" ON profiles
  FOR UPDATE USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  )
  WITH CHECK (true);

-- ============================================================================
-- 5. CREATE AUDIT LOGGING SYSTEM
-- ============================================================================

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  record_id TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS for audit table
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Users can only view their own audit logs
CREATE POLICY "Users can view own audit logs" ON audit_log
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all audit logs
CREATE POLICY "Service role can view all audit logs" ON audit_log
  FOR SELECT USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (user_id, table_name, operation, record_id, old_data)
    VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'), 
      TG_TABLE_NAME, 
      TG_OP, 
      OLD.id::TEXT, 
      row_to_json(OLD)
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (user_id, table_name, operation, record_id, old_data, new_data)
    VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'), 
      TG_TABLE_NAME, 
      TG_OP, 
      NEW.id::TEXT, 
      row_to_json(OLD), 
      row_to_json(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (user_id, table_name, operation, record_id, new_data)
    VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'), 
      TG_TABLE_NAME, 
      TG_OP, 
      NEW.id::TEXT, 
      row_to_json(NEW)
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to critical tables
DROP TRIGGER IF EXISTS profiles_audit ON profiles;
CREATE TRIGGER profiles_audit 
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

DROP TRIGGER IF EXISTS songs_audit ON songs;
CREATE TRIGGER songs_audit 
  AFTER INSERT OR UPDATE OR DELETE ON songs
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

DROP TRIGGER IF EXISTS orders_audit ON orders;
CREATE TRIGGER orders_audit 
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- ============================================================================
-- 6. SECURE USER CREATION FUNCTION
-- ============================================================================

-- Replace the existing function with secure version
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  safe_name TEXT;
BEGIN
  -- Validate user ID
  IF NEW.id IS NULL THEN
    RAISE EXCEPTION 'User ID cannot be null';
  END IF;
  
  -- Sanitize and validate full_name from metadata
  safe_name := COALESCE(
    TRIM(BOTH FROM (NEW.raw_user_meta_data->>'full_name')), 
    'User'
  );
  
  -- Remove potentially harmful characters and limit length
  safe_name := LEFT(
    REGEXP_REPLACE(safe_name, '[<>"\''&%;(){}[\]\\|`~!@#$%^*+=]', '', 'g'), 
    100
  );
  
  -- Ensure we have a valid name
  IF LENGTH(safe_name) < 1 THEN
    safe_name := 'User';
  END IF;
  
  -- Insert profile with validation
  INSERT INTO public.profiles (id, full_name, subscription_status, credits_remaining)
  VALUES (NEW.id, safe_name, 'free', 1);
  
  -- Log successful profile creation
  RAISE LOG 'Profile created successfully for user %', NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Secure error logging without exposing sensitive data
    RAISE LOG 'Profile creation failed for user %. Error: %', NEW.id, SQLERRM;
    -- Re-raise the exception to prevent user creation if profile fails
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. ADD SECURITY INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for audit log queries
CREATE INDEX IF NOT EXISTS audit_log_user_id_idx ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS audit_log_table_operation_idx ON audit_log(table_name, operation);

-- Index for security queries
CREATE INDEX IF NOT EXISTS profiles_subscription_status_idx ON profiles(subscription_status);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);

-- ============================================================================
-- 8. CREATE SECURITY MONITORING VIEWS
-- ============================================================================

-- View for monitoring suspicious activity
CREATE OR REPLACE VIEW security_alerts AS
SELECT 
  al.user_id,
  p.full_name,
  al.table_name,
  al.operation,
  al.created_at,
  CASE 
    WHEN al.table_name = 'profiles' AND al.operation = 'UPDATE' 
         AND al.old_data->>'credits_remaining' != al.new_data->>'credits_remaining' 
    THEN 'CREDIT_CHANGE'
    WHEN al.table_name = 'orders' AND al.operation = 'INSERT'
    THEN 'NEW_ORDER'
    WHEN al.operation = 'DELETE'
    THEN 'DATA_DELETION'
    ELSE 'OTHER'
  END as alert_type
FROM audit_log al
LEFT JOIN profiles p ON p.id = al.user_id
WHERE al.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY al.created_at DESC;

-- Grant access to security alerts view
GRANT SELECT ON security_alerts TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration completion
INSERT INTO audit_log (user_id, table_name, operation, record_id, new_data)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'migration', 
  'INSERT', 
  '20250702_critical_security_fixes', 
  '{"status": "completed", "timestamp": "' || NOW() || '", "description": "Critical security fixes applied"}'::jsonb
);