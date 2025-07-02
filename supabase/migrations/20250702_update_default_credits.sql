-- Update new user default credits to 0
-- This ensures new users must purchase credits before creating songs

-- Update the user creation function to give 0 credits instead of 1
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
  
  -- More permissive character filtering (allows dots, hyphens, apostrophes)
  -- Remove only the most dangerous characters while preserving international names
  safe_name := LEFT(
    REGEXP_REPLACE(safe_name, '[<>"`&;{}[\]\\|~@#$%^*+=]', '', 'g'), 
    100
  );
  
  -- Ensure we have a valid name after sanitization
  IF LENGTH(TRIM(safe_name)) < 1 THEN
    safe_name := 'User';
  END IF;
  
  -- Insert profile with 0 credits (users must purchase credits)
  INSERT INTO public.profiles (id, full_name, subscription_status, credits_remaining)
  VALUES (NEW.id, safe_name, 'free', 0);
  
  RAISE LOG 'Profile created successfully for user % with 0 credits', NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Secure error logging without exposing sensitive data
    RAISE LOG 'Profile creation failed for user %. Error: %', NEW.id, SQLERRM;
    -- Re-raise the exception to prevent user creation if profile fails
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log the change
INSERT INTO audit_log (user_id, table_name, operation, record_id, new_data)
VALUES (
  NULL,  -- System operation
  'configuration', 
  'UPDATE', 
  'default_credits_change', 
  jsonb_build_object(
    'status', 'completed',
    'timestamp', NOW(),
    'change', 'Updated new user default credits from 1 to 0',
    'description', 'Users now start with 0 credits and must purchase to create songs'
  )
);