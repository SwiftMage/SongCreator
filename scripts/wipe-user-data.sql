-- ===================================================================
-- DANGER: This script will DELETE ALL USER DATA from the database
-- Use only for development/testing purposes
-- ===================================================================

-- This script wipes all user-related data to start fresh
-- Execute this in your Supabase SQL editor or via CLI

BEGIN;

-- 1. Delete all user-generated content (in reverse dependency order)

-- Delete billing history (references profiles)
DELETE FROM billing_history;
PRINT 'Deleted billing_history records';

-- Delete orders (references songs and users)
DELETE FROM orders;
PRINT 'Deleted orders records';

-- Delete songs (references users)
DELETE FROM songs;
PRINT 'Deleted songs records';

-- Delete audit logs if they exist (references users)
DELETE FROM audit_log WHERE table_name IN ('profiles', 'songs', 'orders');
PRINT 'Deleted audit_log records';

-- Delete profiles (references auth.users)
DELETE FROM profiles;
PRINT 'Deleted profiles records';

-- 2. Delete auth users (this will cascade to any remaining references)
-- Note: This deletes from Supabase Auth, which will remove:
-- - User accounts
-- - Authentication sessions
-- - User metadata
DELETE FROM auth.users;
PRINT 'Deleted auth.users records';

-- 3. Reset any sequences to start fresh (optional)
-- Note: UUIDs don't use sequences, but if you have any auto-increment IDs:
-- ALTER SEQUENCE IF EXISTS some_sequence_name RESTART WITH 1;

-- 4. Clean up any orphaned data in auth tables
DELETE FROM auth.sessions;
DELETE FROM auth.refresh_tokens;
DELETE FROM auth.audit_log_entries;
PRINT 'Cleaned up auth session data';

COMMIT;

-- ===================================================================
-- Verification queries - run these to confirm data is wiped
-- ===================================================================

-- Check counts (should all be 0)
SELECT 'auth.users' as table_name, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'songs', COUNT(*) FROM songs
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'billing_history', COUNT(*) FROM billing_history;

PRINT 'Database wipe complete. All user data has been removed.';
PRINT 'You can now start fresh with new user registrations.';