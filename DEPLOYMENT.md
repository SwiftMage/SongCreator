# 🚀 Song Mint AI - Deployment Guide

This guide walks you through deploying Song Mint AI from development to production.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Stripe Setup](#stripe-setup)
- [Supabase Setup](#supabase-setup)
- [Platform-Specific Deployment](#platform-specific-deployment)
- [Post-Deployment Checklist](#post-deployment-checklist)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

Before deploying, ensure you have:

- [ ] **Completed development setup** and tested locally
- [ ] **Stripe account** with test data ready for production migration
- [ ] **Supabase project** ready for production
- [ ] **Domain name** configured (optional but recommended)
- [ ] **Git repository** pushed to GitHub/GitLab/Bitbucket

## 🌍 Environment Configuration

### Development vs Production

The application automatically switches between test and production modes based on `NODE_ENV`:

| Environment | NODE_ENV | Stripe Mode | Database | Features |
|-------------|----------|-------------|----------|----------|
| Development | `development` | Test | Development | Debug features enabled |
| Production | `production` | Live | Production | Optimized performance |

### Required Environment Variables

#### Core Application
```bash
# Environment
NODE_ENV=production

# Application
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key

# External APIs
OPENAI_API_KEY=your-openai-api-key
MUREKA_API_KEY=your-mureka-api-key
RESEND_API_KEY=your-resend-api-key

# Audio Backup (Production)
ENABLE_AUDIO_BACKUP=true
```

#### Stripe Configuration (Production)
```bash
# Stripe Live Keys
STRIPE_LIVE_SECRET_KEY=sk_live_your_actual_live_secret_key
NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_your_actual_live_publishable_key

# Stripe Live Product IDs (Monthly Subscriptions)
STRIPE_LIVE_LITE_PRODUCT_ID=prod_your_live_lite_product_id
STRIPE_LIVE_PLUS_PRODUCT_ID=prod_your_live_plus_product_id
STRIPE_LIVE_MAX_PRODUCT_ID=prod_your_live_max_product_id

# Stripe Live Product IDs (One-Time Purchases)
STRIPE_LIVE_STARTER_PRODUCT_ID=prod_your_live_starter_product_id
STRIPE_LIVE_CREATOR_PRODUCT_ID=prod_your_live_creator_product_id
STRIPE_LIVE_PRO_PRODUCT_ID=prod_your_live_pro_product_id
```

## 💳 Stripe Setup

### 1. Switch to Live Mode

1. **Go to your Stripe Dashboard**
2. **Toggle to "Live mode"** (top-left switch)
3. **Verify you're in Live mode** (should show "Live" not "Test")

### 2. Create Production Products

Create the same products you have in test mode:

#### Monthly Subscriptions
- **Lite**: 5 credits/month - $10/month
- **Plus**: 15 credits/month - $20/month  
- **Max**: 30 credits/month - $35/month

#### One-Time Purchases
- **Starter**: 3 credits - $9
- **Creator**: 10 credits - $19
- **Pro**: 20 credits - $29

### 3. Get Live API Keys

1. **Go to Developers → API Keys**
2. **Copy your live keys**:
   - Publishable key: `pk_live_...`
   - Secret key: `sk_live_...`

### 4. Configure Webhooks

1. **Go to Developers → Webhooks**
2. **Add endpoint**: `https://yourdomain.com/api/webhooks/stripe`
3. **Select events**:
   - `invoice.payment_succeeded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

### 5. Copy Product IDs

After creating products, copy their IDs:
```bash
# Monthly subscriptions
STRIPE_LIVE_LITE_PRODUCT_ID=prod_abc123
STRIPE_LIVE_PLUS_PRODUCT_ID=prod_def456
STRIPE_LIVE_MAX_PRODUCT_ID=prod_ghi789

# One-time purchases  
STRIPE_LIVE_STARTER_PRODUCT_ID=prod_jkl012
STRIPE_LIVE_CREATOR_PRODUCT_ID=prod_mno345
STRIPE_LIVE_PRO_PRODUCT_ID=prod_pqr678
```

## 🗄️ Supabase Setup

### 1. Production Database

**Option A: New Production Project**
1. Create a new Supabase project for production
2. Run all migrations from your development project
3. Configure Row Level Security (RLS) policies

**Option B: Promote Existing Project**
1. Ensure your current project is ready for production
2. Update connection limits and performance settings

### 2. Required Tables & Policies

Ensure these tables exist with proper RLS:
- `profiles` - User profiles and credits
- `songs` - Generated songs
- `audit_log` - Security audit trail
- `billing_history` - Subscription billing records

### 3. Environment Variables

Get from Supabase Project Settings → API:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🚀 Platform-Specific Deployment

### Vercel (Recommended)

1. **Connect Repository**
   ```bash
   # Deploy from GitHub
   npx vercel --prod
   ```

2. **Set Environment Variables**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all production environment variables
   - Set `NODE_ENV=production`

3. **Configure Domain**
   - Add custom domain in Vercel settings
   - Configure DNS records

### Netlify

1. **Deploy Site**
   ```bash
   # Build command
   npm run build
   
   # Publish directory
   .next
   ```

2. **Environment Variables**
   - Site Settings → Environment Variables
   - Add all production variables

### Railway

1. **Deploy from GitHub**
   ```bash
   railway login
   railway link
   railway up
   ```

2. **Set Variables**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set NEXT_PUBLIC_APP_URL=https://yourdomain.com
   # ... add all other variables
   ```

### Docker (Self-Hosted)

1. **Build Production Image**
   ```dockerfile
   # Dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   ENV NODE_ENV=production
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Deploy**
   ```bash
   docker build -t song-mint .
   docker run -p 3000:3000 --env-file .env.production song-mint
   ```

## ✅ Post-Deployment Checklist

### Immediate Testing

- [ ] **Homepage loads** without errors
- [ ] **Authentication works** (signup/login)
- [ ] **Create song flow** completes successfully
- [ ] **Payment processing** works with test card
- [ ] **Subscription checkout** redirects to Stripe correctly
- [ ] **Email notifications** are sent
- [ ] **Dashboard** displays user data properly

### Stripe Integration

- [ ] **Test payments** work in live mode
- [ ] **Webhooks** are receiving events
- [ ] **Customer portal** accessible
- [ ] **Subscription billing** processes correctly
- [ ] **Credits** are added after payment

### Performance & Security

- [ ] **SSL certificate** is active (HTTPS)
- [ ] **Environment variables** are secure
- [ ] **Database connections** are optimized
- [ ] **API rate limiting** is working
- [ ] **Error monitoring** is set up

## 📊 Monitoring & Maintenance

### Error Monitoring

**Recommended Tools:**
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **Vercel Analytics** - Performance monitoring

**Setup:**
```bash
npm install @sentry/nextjs
# Configure in next.config.js
```

### Database Monitoring

**Monitor:**
- Connection pool usage
- Query performance
- Storage usage
- RLS policy effectiveness

### Stripe Monitoring

**Watch For:**
- Failed payments
- Webhook delivery issues  
- Subscription churn
- Fraud attempts

## 🔧 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check Node.js version
node --version  # Should be 18+

# Clear cache and reinstall
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

#### Stripe Integration Issues
```bash
# Verify environment variables
echo $STRIPE_LIVE_SECRET_KEY
echo $STRIPE_LIVE_PUBLISHABLE_KEY

# Test webhook endpoint
curl -X POST https://yourdomain.com/api/webhooks/stripe
```

#### Database Connection Issues
```bash
# Check Supabase connection
psql "postgresql://postgres:[password]@[host]:5432/postgres"
```

#### Environment Variable Issues
```bash
# Verify all required variables are set
npm run build  # Should show validation errors if missing
```

### Debug Mode

Enable debug logging in production:
```bash
# Add to environment variables
DEBUG=stripe:*,supabase:*
```

### Rollback Plan

If deployment fails:
1. **Revert to previous commit**
2. **Switch back to test mode** (`NODE_ENV=development`)
3. **Restore database backup** if needed
4. **Update DNS** to point to stable version

## 📞 Support Contacts

- **Stripe Support**: https://support.stripe.com
- **Supabase Support**: https://supabase.com/support  
- **Vercel Support**: https://vercel.com/support
- **Domain/DNS Issues**: Contact your domain registrar

---

## 🎯 Success Metrics

After deployment, monitor:
- **Uptime**: 99.9%+
- **Response Time**: <2s
- **Error Rate**: <1%
- **Payment Success Rate**: 95%+
- **User Conversion**: Track signup→payment flow

---

*Last Updated: $(date)*
*Version: 1.0*