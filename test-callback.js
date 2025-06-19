// Quick test script - run with: node test-callback.js
// This will help you test email verification without creating new users

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://rauygjkxeupqslsvpyvf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhdXlnamt4ZXVwcXNsc3ZweXZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxOTM3OTEsImV4cCI6MjA2NTc2OTc5MX0.RW-5OW_M5kmR8Ek0mQ9yQxRDpbH-nslK8MtryjdP4R4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function resendVerification(email) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email
  })
  
  if (error) {
    console.log('Error:', error.message)
  } else {
    console.log('Verification email sent to:', email)
  }
}

// Replace with your test email
resendVerification('your-test-email@example.com')