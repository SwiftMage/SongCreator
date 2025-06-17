# SongCreator Setup Guide

## 1. Supabase Setup

### Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization and set:
   - Project name: `songcreator`
   - Database password: (generate a strong password)
   - Region: Choose closest to your users
4. Wait for project to be created (2-3 minutes)

### Get Project Credentials
1. Go to Project Settings → API
2. Copy these values:
   - **Project URL** (looks like: `https://xyz.supabase.co`)
   - **Project API Key (anon/public)** (starts with `eyJ...`)
   - **Service Role Key** (starts with `eyJ...`) - keep this secret!

### Update Environment Variables
Edit `.env.local` and replace the placeholder values:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Set up Database Schema
1. In your Supabase dashboard, go to SQL Editor
2. Copy the contents of `supabase/schema.sql`
3. Paste and run the SQL to create tables and policies

## 2. Other Service Setup

### OpenAI API
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an API key
3. Add to `.env.local`: `OPENAI_API_KEY=sk-...`

### LemonSqueezy (Payment Processing)
1. Sign up at [lemonsqueezy.com](https://lemonsqueezy.com)
2. Create a store and products
3. Get API credentials from Settings → API
4. Add to `.env.local`

### Resend (Email Service)
1. Sign up at [resend.com](https://resend.com)
2. Create an API key
3. Add to `.env.local`: `RESEND_API_KEY=re_...`

## 3. Run the Application
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.