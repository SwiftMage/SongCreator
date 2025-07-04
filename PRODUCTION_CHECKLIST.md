# 🚀 Production Deployment Checklist

Quick checklist for deploying Song Mint AI to production.

## 📋 Pre-Deployment

### Environment Setup
- [ ] Set `NODE_ENV=production`
- [ ] Update `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Configure production Supabase project
- [ ] Set up production Stripe account

### Stripe Live Mode Setup
- [ ] Switch Stripe dashboard to Live mode
- [ ] Create live products (Lite, Plus, Max subscriptions)
- [ ] Create live products (Starter, Creator, Pro one-time)
- [ ] Copy live API keys (`pk_live_...`, `sk_live_...`)
- [ ] Copy live product IDs
- [ ] Configure production webhook endpoint
- [ ] Test webhook delivery

### Environment Variables
```bash
# Core
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Supabase Production
NEXT_PUBLIC_SUPABASE_URL=https://your-prod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-key

# Stripe Live
STRIPE_LIVE_SECRET_KEY=sk_live_your_key
NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_your_key

# Stripe Live Products
STRIPE_LIVE_LITE_PRODUCT_ID=prod_your_lite_id
STRIPE_LIVE_PLUS_PRODUCT_ID=prod_your_plus_id
STRIPE_LIVE_MAX_PRODUCT_ID=prod_your_max_id
STRIPE_LIVE_STARTER_PRODUCT_ID=prod_your_starter_id
STRIPE_LIVE_CREATOR_PRODUCT_ID=prod_your_creator_id
STRIPE_LIVE_PRO_PRODUCT_ID=prod_your_pro_id

# External APIs
OPENAI_API_KEY=your_openai_key
MUREKA_API_KEY=your_mureka_key
RESEND_API_KEY=your_resend_key

# Features
ENABLE_AUDIO_BACKUP=true
```

## 🔄 Deployment Process

### 1. Code Preparation
- [ ] Ensure all changes are committed
- [ ] Run `npm run build` successfully locally
- [ ] Run `npm run lint` (fix critical issues)
- [ ] Test core functionality locally

### 2. Platform Deployment
- [ ] Deploy to hosting platform (Vercel/Netlify/Railway)
- [ ] Set all environment variables
- [ ] Configure custom domain
- [ ] Enable HTTPS/SSL

### 3. Database Migration
- [ ] Run any pending Supabase migrations
- [ ] Verify all tables exist with correct schema
- [ ] Test database connections
- [ ] Verify RLS policies are active

## ✅ Post-Deployment Testing

### Critical Path Testing
- [ ] Homepage loads without errors
- [ ] User registration works
- [ ] Google OAuth login works
- [ ] Song creation flow completes
- [ ] Stripe checkout redirects properly
- [ ] Payment processing works (test with Stripe test cards)
- [ ] Credits are added after successful payment
- [ ] Email notifications are sent
- [ ] Dashboard displays correctly

### Stripe Integration Testing
- [ ] One-time purchase checkout works
- [ ] Subscription checkout works
- [ ] Customer portal accessible
- [ ] Webhook events are received
- [ ] Credits are allocated correctly
- [ ] Billing history updates

### Security & Performance
- [ ] HTTPS is enforced
- [ ] Environment variables are secure
- [ ] API rate limiting works
- [ ] Error pages display properly
- [ ] 404 pages work correctly

## 📊 Monitoring Setup

### Error Tracking
- [ ] Configure error monitoring (Sentry recommended)
- [ ] Set up performance monitoring
- [ ] Configure uptime monitoring
- [ ] Set up log aggregation

### Business Metrics
- [ ] Track user signups
- [ ] Monitor payment conversion rates
- [ ] Track song creation success rates
- [ ] Monitor subscription churn

## 🚨 Emergency Procedures

### Rollback Plan
1. **Immediate**: Revert to previous deployment
2. **Database**: Restore from backup if needed
3. **DNS**: Point traffic to stable version
4. **Communication**: Notify users of any issues

### Support Contacts
- **Technical Issues**: Check logs and error monitoring
- **Payment Issues**: Contact Stripe support
- **Database Issues**: Check Supabase dashboard
- **DNS Issues**: Contact domain registrar

## 📈 Success Criteria

Post-deployment, ensure:
- **Uptime**: 99.9%+ 
- **Response Time**: <2 seconds average
- **Error Rate**: <1%
- **Payment Success**: 95%+ success rate
- **User Experience**: Smooth signup→payment→song creation flow

---

## 🆘 Quick Fixes

### Common Issues
```bash
# Build fails
rm -rf .next node_modules
npm install && npm run build

# Environment variables not loading
# Check platform-specific env var syntax

# Stripe webhook not working
# Verify endpoint URL and selected events

# Database connection issues  
# Check Supabase connection limits and RLS policies
```

### Emergency Contacts
- **Stripe**: https://support.stripe.com
- **Supabase**: https://supabase.com/support
- **Vercel**: https://vercel.com/support

---

*Use this checklist alongside the detailed [DEPLOYMENT.md](./DEPLOYMENT.md) guide.*