-- Fix New User Default Credits Migration
-- Date: 2025-07-03
-- Purpose: Ensure new users start with 0 credits instead of 1

-- Update the handle_new_user() function to set credits_remaining to 0
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
  
  -- Ensure we have at least 'User' if sanitization removed everything
  IF LENGTH(TRIM(safe_name)) = 0 THEN
    safe_name := 'User';
  END IF;
  
  -- Insert new profile with 0 credits (users must purchase credits)
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

-- Log the migration completion
DO $$
BEGIN
  RAISE LOG 'Migration completed: handle_new_user() function updated to set new users to 0 credits';
END $$;