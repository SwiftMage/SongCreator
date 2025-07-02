-- Quick test to verify the audit table structure works
-- Run this small test first if you want to verify the fix

-- Test 1: Create the audit table structure only
CREATE TABLE IF NOT EXISTS audit_log_test (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'CREDIT_ADD', 'CREDIT_DEDUCT')),
  record_id TEXT,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Test 2: Try inserting with NULL user_id (should work now)
INSERT INTO audit_log_test (user_id, table_name, operation, record_id, new_data)
VALUES (
  NULL,  -- This should work now
  'test_migration', 
  'INSERT', 
  'test_record', 
  '{"test": true}'::jsonb
);

-- Test 3: Verify the insert worked
SELECT 'Test passed - audit table accepts NULL user_id' as result, COUNT(*) as records
FROM audit_log_test;

-- Cleanup
DROP TABLE audit_log_test;