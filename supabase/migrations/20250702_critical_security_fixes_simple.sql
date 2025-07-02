-- CRITICAL Security Fixes Migration - SIMPLIFIED VERSION
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

-- Allow users to delete their own orders (safe to run multiple times)
DROP POLICY IF EXISTS "Users can delete own orders" ON orders;
CREATE POLICY "Users can delete own orders" ON orders
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 3. ADD DATA INTEGRITY CONSTRAINTS (SIMPLIFIED)
-- ============================================================================

-- Set NOT NULL on critical fields
ALTER TABLE profiles 
ALTER COLUMN subscription_status SET NOT NULL,
ALTER COLUMN credits_remaining SET NOT NULL;

-- Add basic constraints (will skip if they exist)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS positive_credits;
ALTER TABLE profiles ADD CONSTRAINT positive_credits CHECK (credits_remaining >= 0);

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS max_credits;
ALTER TABLE profiles ADD CONSTRAINT max_credits CHECK (credits_remaining <= 10000);

ALTER TABLE orders DROP CONSTRAINT IF EXISTS positive_amount;
ALTER TABLE orders ADD CONSTRAINT positive_amount CHECK (amount > 0);

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
DROP POLICY IF EXISTS "Service role can update credits and subscription" ON profiles;
CREATE POLICY "Service role can update credits and subscription" ON profiles
  FOR UPDATE USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  )
  WITH CHECK (true);

-- ============================================================================
-- 5. CREATE BASIC AUDIT LOGGING SYSTEM
-- ============================================================================

-- Create audit log table (simple version)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  record_id TEXT,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS for audit table
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_log;
DROP POLICY IF EXISTS "Service role can view all audit logs" ON audit_log;

-- Users can only view their own audit logs
CREATE POLICY "Users can view own audit logs" ON audit_log
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can view all audit logs
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

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS profiles_audit ON profiles;
DROP TRIGGER IF EXISTS songs_audit ON songs;
DROP TRIGGER IF EXISTS orders_audit ON orders;

-- Add audit triggers to critical tables
CREATE TRIGGER profiles_audit 
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER songs_audit 
  AFTER INSERT OR UPDATE OR DELETE ON songs
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

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
-- 7. ADD BASIC SECURITY INDEXES
-- ============================================================================

-- Index for audit log queries
CREATE INDEX IF NOT EXISTS audit_log_user_id_idx ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS audit_log_table_operation_idx ON audit_log(table_name, operation);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration completion
INSERT INTO audit_log (user_id, table_name, operation, record_id, new_data)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'migration', 
  'INSERT', 
  '20250702_critical_security_fixes_simple', 
  '{"status": "completed", "timestamp": "' || NOW() || '", "description": "Critical security fixes applied"}'::jsonb
);

-- Final verification query (run this to verify everything worked)
SELECT 
  'Migration completed successfully!' as status,
  COUNT(*) as audit_entries_created
FROM audit_log 
WHERE table_name = 'migration';