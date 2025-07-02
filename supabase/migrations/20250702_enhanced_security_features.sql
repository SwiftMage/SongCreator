-- Enhanced Security Features Migration
-- Run this AFTER the critical security fixes

-- ============================================================================
-- 1. DATABASE-LEVEL RATE LIMITING SYSTEM
-- ============================================================================

-- Create rate limiting table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rate_limits') THEN
    CREATE TABLE rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  endpoint TEXT NOT NULL,
  requests_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_request TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );
  END IF;
END $$;

-- Enable RLS on rate limits (only if table was created)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rate_limits') THEN
    ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Users can view their own rate limit data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'rate_limits' 
    AND policyname = 'Users can view own rate limits'
  ) THEN
    CREATE POLICY "Users can view own rate limits" ON rate_limits
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create rate limiting function
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_ip_address INET,
  p_endpoint TEXT,
  p_limit INTEGER,
  p_window_minutes INTEGER DEFAULT 60
) RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate window start time
  window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Clean old entries (older than window)
  DELETE FROM rate_limits 
  WHERE (user_id = p_user_id OR ip_address = p_ip_address)
    AND endpoint = p_endpoint 
    AND window_start < window_start;
  
  -- Count current requests in window
  SELECT COALESCE(SUM(requests_count), 0) INTO current_count
  FROM rate_limits 
  WHERE (user_id = p_user_id OR ip_address = p_ip_address)
    AND endpoint = p_endpoint 
    AND rate_limits.window_start >= window_start;
  
  -- Check if limit exceeded
  IF current_count >= p_limit THEN
    RETURN FALSE;
  END IF;
  
  -- Record this request
  INSERT INTO rate_limits (user_id, ip_address, endpoint, requests_count, window_start, last_request)
  VALUES (p_user_id, p_ip_address, p_endpoint, 1, NOW(), NOW())
  ON CONFLICT (user_id, endpoint) 
  DO UPDATE SET 
    requests_count = rate_limits.requests_count + 1,
    last_request = NOW(),
    ip_address = EXCLUDED.ip_address;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create rate limiting check function for API endpoints
CREATE OR REPLACE FUNCTION api_rate_limit_check(
  p_endpoint TEXT,
  p_user_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  -- Define rate limits per endpoint
  CASE p_endpoint
    WHEN 'music_generation' THEN
      RETURN check_rate_limit(p_user_id, p_ip_address, p_endpoint, 5, 60); -- 5 per hour
    WHEN 'email_send' THEN
      RETURN check_rate_limit(p_user_id, p_ip_address, p_endpoint, 3, 60); -- 3 per hour
    WHEN 'profile_update' THEN
      RETURN check_rate_limit(p_user_id, p_ip_address, p_endpoint, 10, 15); -- 10 per 15 min
    WHEN 'song_create' THEN
      RETURN check_rate_limit(p_user_id, p_ip_address, p_endpoint, 20, 60); -- 20 per hour
    WHEN 'general_api' THEN
      RETURN check_rate_limit(p_user_id, p_ip_address, p_endpoint, 100, 15); -- 100 per 15 min
    ELSE
      RETURN check_rate_limit(p_user_id, p_ip_address, 'unknown', 50, 15); -- Default limit
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. ADVANCED SECURITY MONITORING
-- ============================================================================

-- Create security events table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_events') THEN
    CREATE TABLE security_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'RATE_LIMIT_EXCEEDED', 'INVALID_ACCESS_ATTEMPT', 'PRIVILEGE_ESCALATION',
    'SUSPICIOUS_QUERY', 'LOGIN_ANOMALY', 'DATA_EXPORT_LARGE'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  description TEXT NOT NULL,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );
  END IF;
END $$;

-- Enable RLS (only if table was created)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_events') THEN
    ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Service role can view all security events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'security_events' 
    AND policyname = 'Service role can manage security events'
  ) THEN
    CREATE POLICY "Service role can manage security events" ON security_events
      FOR ALL USING (
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
      );
  END IF;
END $$;

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_severity TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO security_events (
    user_id, event_type, severity, description, metadata, ip_address, user_agent
  ) VALUES (
    p_user_id, p_event_type, p_severity, p_description, p_metadata, p_ip_address, p_user_agent
  ) RETURNING id INTO event_id;
  
  -- Log to PostgreSQL logs for external monitoring
  RAISE LOG 'SECURITY_EVENT: % - % - User: % - %', p_severity, p_event_type, p_user_id, p_description;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. DATA PRIVACY ENHANCEMENTS
-- ============================================================================

-- Create function to anonymize user data (for GDPR compliance)
CREATE OR REPLACE FUNCTION anonymize_user_data(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if caller has permission (must be the user or service role)
  IF auth.uid() != p_user_id AND 
     current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: Cannot anonymize other user data';
  END IF;
  
  -- Anonymize profile data
  UPDATE profiles SET
    full_name = 'Anonymous User',
    created_at = created_at -- Keep timestamp but anonymize identity
  WHERE id = p_user_id;
  
  -- Anonymize songs (keep for analytics but remove personal data)
  UPDATE songs SET
    title = 'Anonymous Song',
    song_title = 'Anonymous Song',
    generated_lyrics = '[REDACTED]',
    questionnaire_data = '{}'::jsonb
  WHERE user_id = p_user_id;
  
  -- Log the anonymization
  PERFORM log_security_event(
    p_user_id,
    'DATA_ANONYMIZATION',
    'MEDIUM',
    'User data anonymized for privacy compliance',
    '{"action": "anonymize", "tables": ["profiles", "songs"]}'::jsonb
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. BACKUP AND RECOVERY POLICIES
-- ============================================================================

-- Create backup log table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'backup_log') THEN
    CREATE TABLE backup_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_type TEXT NOT NULL CHECK (backup_type IN ('FULL', 'INCREMENTAL', 'SCHEMA')),
  status TEXT NOT NULL CHECK (status IN ('STARTED', 'COMPLETED', 'FAILED')),
  file_path TEXT,
  file_size BIGINT,
  checksum TEXT,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
    );
  END IF;
END $$;

-- Function to verify data integrity
CREATE OR REPLACE FUNCTION verify_data_integrity()
RETURNS TABLE(table_name TEXT, issue_count BIGINT, issues TEXT[]) AS $$
BEGIN
  RETURN QUERY
  SELECT 'profiles'::TEXT, 
         COUNT(*)::BIGINT,
         ARRAY_AGG('User ' || id || ': ' || issue)::TEXT[]
  FROM (
    SELECT p.id, 
           CASE 
             WHEN p.credits_remaining < 0 THEN 'Negative credits'
             WHEN p.subscription_status NOT IN ('free', 'pro', 'premium', 'enterprise') THEN 'Invalid subscription'
             WHEN p.full_name IS NULL OR LENGTH(TRIM(p.full_name)) = 0 THEN 'Missing name'
           END as issue
    FROM profiles p
    WHERE p.credits_remaining < 0 
       OR p.subscription_status NOT IN ('free', 'pro', 'premium', 'enterprise')
       OR p.full_name IS NULL 
       OR LENGTH(TRIM(p.full_name)) = 0
  ) issues;
  
  RETURN QUERY
  SELECT 'songs'::TEXT,
         COUNT(*)::BIGINT,
         ARRAY_AGG('Song ' || id || ': ' || issue)::TEXT[]
  FROM (
    SELECT s.id,
           CASE
             WHEN s.user_id NOT IN (SELECT id FROM auth.users) THEN 'Orphaned song'
             WHEN s.status NOT IN ('pending', 'processing', 'completed', 'failed') THEN 'Invalid status'
           END as issue
    FROM songs s
    WHERE s.user_id NOT IN (SELECT id FROM auth.users)
       OR s.status NOT IN ('pending', 'processing', 'completed', 'failed')
  ) issues;
  
  RETURN QUERY
  SELECT 'orders'::TEXT,
         COUNT(*)::BIGINT,
         ARRAY_AGG('Order ' || id || ': ' || issue)::TEXT[]
  FROM (
    SELECT o.id,
           CASE
             WHEN o.amount <= 0 THEN 'Invalid amount'
             WHEN o.user_id NOT IN (SELECT id FROM auth.users) THEN 'Orphaned order'
           END as issue
    FROM orders o
    WHERE o.amount <= 0
       OR o.user_id NOT IN (SELECT id FROM auth.users)
  ) issues;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. PERFORMANCE SECURITY INDEXES
-- ============================================================================

-- Indexes for security and rate limiting queries
CREATE INDEX IF NOT EXISTS rate_limits_user_endpoint_idx ON rate_limits(user_id, endpoint);
CREATE INDEX IF NOT EXISTS rate_limits_ip_endpoint_idx ON rate_limits(ip_address, endpoint);
CREATE INDEX IF NOT EXISTS rate_limits_window_start_idx ON rate_limits(window_start);

-- Security events indexes
CREATE INDEX IF NOT EXISTS security_events_user_id_idx ON security_events(user_id);
CREATE INDEX IF NOT EXISTS security_events_type_severity_idx ON security_events(event_type, severity);
CREATE INDEX IF NOT EXISTS security_events_created_at_idx ON security_events(created_at);
CREATE INDEX IF NOT EXISTS security_events_unresolved_idx ON security_events(resolved) WHERE resolved = FALSE;

-- Audit log performance indexes
CREATE INDEX IF NOT EXISTS audit_log_user_table_idx ON audit_log(user_id, table_name);
CREATE INDEX IF NOT EXISTS audit_log_operation_time_idx ON audit_log(operation, created_at);

-- ============================================================================
-- 6. SECURITY CONFIGURATION FUNCTIONS
-- ============================================================================

-- Function to get security status
CREATE OR REPLACE FUNCTION get_security_status()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  total_users INTEGER;
  active_sessions INTEGER;
  recent_security_events INTEGER;
  rate_limit_violations INTEGER;
BEGIN
  -- Get basic statistics
  SELECT COUNT(*) INTO total_users FROM profiles;
  SELECT COUNT(*) INTO recent_security_events 
  FROM security_events 
  WHERE created_at >= NOW() - INTERVAL '24 hours';
  
  SELECT COUNT(*) INTO rate_limit_violations
  FROM rate_limits 
  WHERE window_start >= NOW() - INTERVAL '1 hour';
  
  result := jsonb_build_object(
    'total_users', total_users,
    'recent_security_events', recent_security_events,
    'rate_limit_activity', rate_limit_violations,
    'rls_enabled', true,
    'audit_logging', true,
    'last_check', NOW()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old security data
CREATE OR REPLACE FUNCTION cleanup_security_data()
RETURNS VOID AS $$
BEGIN
  -- Clean up old rate limit entries (older than 24 hours)
  DELETE FROM rate_limits 
  WHERE window_start < NOW() - INTERVAL '24 hours';
  
  -- Clean up old audit logs (older than 90 days, but keep important events)
  DELETE FROM audit_log 
  WHERE created_at < NOW() - INTERVAL '90 days'
    AND table_name NOT IN ('profiles') -- Keep profile changes longer
    AND operation != 'DELETE'; -- Keep deletion records
  
  -- Mark old security events as resolved if they're low severity and old
  UPDATE security_events 
  SET resolved = TRUE 
  WHERE severity = 'LOW' 
    AND created_at < NOW() - INTERVAL '30 days'
    AND resolved = FALSE;
  
  RAISE LOG 'Security data cleanup completed at %', NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. CREATE SCHEDULED CLEANUP JOB (if pg_cron is available)
-- ============================================================================

-- Note: This requires pg_cron extension to be enabled
-- Uncomment if you have pg_cron available:

/*
-- Clean up security data daily at 2 AM
SELECT cron.schedule('security-cleanup', '0 2 * * *', 'SELECT cleanup_security_data();');

-- Run data integrity check weekly
SELECT cron.schedule('integrity-check', '0 3 * * 0', 'SELECT verify_data_integrity();');
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log enhanced security features installation
INSERT INTO audit_log (user_id, table_name, operation, record_id, new_data)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'migration', 
  'INSERT', 
  '20250702_enhanced_security_features', 
  '{"status": "completed", "timestamp": "' || NOW() || '", "description": "Enhanced security features installed"}'::jsonb
);

-- Create initial security status report
INSERT INTO security_events (user_id, event_type, severity, description, metadata)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'SYSTEM_UPGRADE',
  'MEDIUM',
  'Enhanced security features activated',
  get_security_status()
);