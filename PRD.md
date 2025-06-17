# Custom Song Generator SaaS - Product Requirements Document

## 1. Product Overview

### Vision Statement
Create a user-friendly SaaS platform that enables anyone to generate personalized, AI-created songs through a guided questionnaire workflow, delivering professional-quality custom songs for special occasions, gifts, or personal enjoyment.

### Target Audience
- **Primary**: Individuals seeking personalized gifts for special occasions (birthdays, anniversaries, weddings, graduations)
- **Secondary**: Content creators, small businesses, event planners
- **Demographics**: Ages 25-55, disposable income for premium digital services, tech-comfortable users

## 2. Core Features

### 2.1 User Workflow
1. **Landing Page** - Value proposition, pricing, samples
2. **User Registration/Login** - Account creation and authentication
3. **Song Creation Wizard** - Guided questionnaire workflow
4. **Payment Processing** - Secure checkout for song generation
5. **Song Generation** - AI processing (lyrics → music)
6. **Song Delivery** - Download/streaming of completed song
7. **Account Management** - View past songs, billing, profile

### 2.2 Questionnaire Workflow
**Step 1: Song Basics**
- Song title/name
- Recipient name
- Occasion (birthday, anniversary, wedding, etc.)
- Song style/genre preferences
- Mood (happy, romantic, celebratory, etc.)

**Step 2: Personal Details**
- Relationship to recipient
- Special memories or inside jokes
- Important dates or milestones
- Personality traits of recipient
- Favorite activities together

**Step 3: Song Preferences**
- Song length (30s, 1min, 2min, full song)
- Musical style preferences
- Voice type preference (male/female/instrumental)
- Tempo preference (slow, medium, upbeat)

**Step 4: Review & Customize**
- Preview generated prompt
- Make adjustments
- Confirm order

## 3. Technical Architecture

### 3.1 Technology Stack
```
Frontend: Next.js 15 + TypeScript + Tailwind CSS
Backend: Next.js API routes
Database: Supabase (PostgreSQL)
Authentication: Supabase Auth
Hosting: Vercel Free Tier
Payments: LemonSqueezy
Email: Resend
AI APIs: OpenAI GPT-4 + [Music Generation API TBD]
```

### 3.2 Database Schema
```sql
-- Users table (handled by Supabase Auth)
users (
  id UUID PRIMARY KEY,
  email VARCHAR,
  created_at TIMESTAMP
)

-- User profiles
profiles (
  id UUID REFERENCES users(id),
  full_name VARCHAR,
  subscription_status VARCHAR,
  credits_remaining INTEGER,
  created_at TIMESTAMP
)

-- Songs
songs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title VARCHAR,
  status VARCHAR, -- 'pending', 'processing', 'completed', 'failed'
  questionnaire_data JSONB,
  generated_lyrics TEXT,
  audio_url VARCHAR,
  payment_id VARCHAR,
  created_at TIMESTAMP,
  completed_at TIMESTAMP
)

-- Orders
orders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  song_id UUID REFERENCES songs(id),
  amount DECIMAL,
  currency VARCHAR,
  payment_provider_id VARCHAR,
  status VARCHAR, -- 'pending', 'paid', 'failed', 'refunded'
  created_at TIMESTAMP
)
```

### 3.3 API Structure
```
/api/auth/           - Authentication endpoints (Supabase)
/api/songs/          - Song CRUD operations
/api/songs/create    - Create new song order
/api/songs/generate  - Trigger AI generation
/api/songs/status    - Check generation status
/api/payment/        - Payment processing (LemonSqueezy)
/api/webhooks/       - Payment webhooks
```

## 4. User Experience Flow

### 4.1 New User Journey
1. **Landing Page** → Clear value prop, song samples, pricing
2. **Sign Up** → Email/password or social login
3. **Create First Song** → Guided questionnaire
4. **Payment** → Secure checkout with LemonSqueezy
5. **Generation** → Progress indicator, estimated time
6. **Delivery** → Song ready notification + download

### 4.2 Returning User Journey
1. **Login** → Dashboard with past songs
2. **Create New Song** → Streamlined flow
3. **Account Management** → Billing, profile, song history

## 5. Pricing Strategy

### 5.1 Initial Pricing Model
- **Pay-per-song**: $9.99 per custom song
- **3-song bundle**: $24.99 ($8.33 per song)
- **Future**: Monthly subscription for power users

### 5.2 Free Tier Considerations
- 30-second preview for free
- Full song requires payment
- No free songs (AI costs money)

## 6. AI Integration

### 6.1 Lyrics Generation (OpenAI GPT-4)
```
Prompt Template:
"Create lyrics for a [GENRE] song titled '[TITLE]' for [RECIPIENT] 
on the occasion of [OCCASION]. The song should be [MOOD] and 
include these personal details: [PERSONAL_DETAILS]. 
Structure: Verse 1, Chorus, Verse 2, Chorus, Bridge, Final Chorus."
```

### 6.2 Music Generation (TBD)
- Research free/low-cost APIs
- Consider: Mubert, Soundful, open-source options
- Fallback: Partner with musicians for initial versions

## 7. MVP Requirements

### 7.1 Phase 1 (MVP)
**Must Have:**
- Landing page with value proposition
- User registration/authentication
- Song questionnaire workflow (all 4 steps)
- Payment integration with LemonSqueezy
- OpenAI integration for lyrics generation
- Basic song status tracking
- Email notifications
- User dashboard

**Nice to Have:**
- Song samples on landing page
- Social media sharing
- Song history/library

### 7.2 Phase 2 (Post-MVP)
- Music generation integration
- Song revisions/regeneration
- Advanced customization options
- Subscription model
- Affiliate program
- Mobile app

## 8. Success Metrics

### 8.1 Key Performance Indicators
- **Conversion Rate**: Visitors → paying customers
- **Average Revenue Per User (ARPU)**
- **Customer Acquisition Cost (CAC)**
- **Song Generation Success Rate** (technical metric)
- **Customer Satisfaction Score** (post-delivery survey)
- **Monthly Recurring Revenue** (if subscription model)

### 8.2 Technical Metrics
- API response times
- Song generation failure rate
- Payment success rate
- User completion rate through questionnaire

## 9. Risk Mitigation

### 9.1 Technical Risks
- **AI API failures**: Implement retry logic, fallback prompts
- **High AI costs**: Monitor usage, implement rate limiting
- **Scaling issues**: Start with Vercel/Supabase free tiers, plan upgrades

### 9.2 Business Risks
- **Low conversion**: A/B test pricing, landing page, samples
- **Poor song quality**: Curate prompts, potentially human review
- **Competitor analysis**: Research existing solutions, differentiate

## 10. Launch Strategy

### 10.1 Pre-Launch
- Build MVP with 2-3 music styles
- Create 5-10 sample songs for marketing
- Set up analytics (Google Analytics, Mixpanel)
- Prepare customer support system

### 10.2 Launch
- **Week 1**: Soft launch to friends/family
- **Week 2-3**: Social media marketing, Product Hunt
- **Month 1**: Content marketing, SEO optimization
- **Month 2+**: Paid advertising, partnerships

## 11. Future Roadmap

### 11.1 6-Month Goals
- 100+ songs generated
- $1,000+ monthly revenue
- 5-star average rating
- Mobile-responsive perfection

### 11.2 12-Month Vision
- Multiple music styles and genres
- Subscription model launched
- API for business customers
- 1,000+ satisfied customers