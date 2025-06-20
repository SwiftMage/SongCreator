-- Run this in Supabase SQL editor to add credits to your user
-- Replace 'YOUR_USER_ID' with your actual user ID from the auth.users table

UPDATE profiles 
SET credits_remaining = credits_remaining + 10 
WHERE id = 'YOUR_USER_ID';
