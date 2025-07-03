-- Remove email column from profiles table
-- Email should only be stored in auth.users (single source of truth)

-- Drop the email index first
DROP INDEX IF EXISTS profiles_email_idx;

-- Remove the email column
ALTER TABLE profiles DROP COLUMN IF EXISTS email;

-- Update any existing queries that might depend on email column
-- (This migration removes the redundant email storage - email is available via auth.users)

-- Note: After this migration, use user.email from Supabase Auth context
-- instead of profile.email for all email-related operations