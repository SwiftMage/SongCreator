-- Cleanup Incorrect Default Credits Migration
-- Date: 2025-07-03
-- Purpose: Fix existing users who got 1 credit instead of 0 by mistake

-- Log existing users with exactly 1 credit for transparency
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  -- Count users with exactly 1 credit who have never created songs
  SELECT COUNT(*) INTO affected_count
  FROM profiles p
  WHERE p.credits_remaining = 1
    AND p.subscription_status = 'free'
    AND NOT EXISTS (
      SELECT 1 FROM songs s WHERE s.user_id = p.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM orders o WHERE o.user_id = p.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM billing_history bh WHERE bh.user_id = p.id
    );

  RAISE LOG 'Found % users with 1 credit who appear to be new users with incorrect defaults', affected_count;

  -- Reset their credits to 0 (only for users who haven't used the service)
  UPDATE profiles 
  SET credits_remaining = 0
  WHERE credits_remaining = 1
    AND subscription_status = 'free'
    AND NOT EXISTS (
      SELECT 1 FROM songs s WHERE s.user_id = profiles.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM orders o WHERE o.user_id = profiles.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM billing_history bh WHERE bh.user_id = profiles.id
    );

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RAISE LOG 'Reset % new users from 1 credit to 0 credits', affected_count;

END $$;