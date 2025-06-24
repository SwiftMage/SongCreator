# Song Mint - Product Specification

## Overview

Song Mint is an AI-powered web application that enables users to create personalized songs for any occasion. By combining detailed questionnaires with advanced AI technology, the platform generates custom lyrics and music that capture personal relationships, memories, and emotions.

## Core Concept

Users answer a series of personalized questions about the song recipient, and the AI creates both lyrics (using OpenAI) and music (using Mureka API) tailored to their specific relationship and shared experiences.

## Target Users

- Individuals looking to create unique gifts for loved ones
- People celebrating special occasions (birthdays, anniversaries, holidays)
- Anyone wanting to express feelings through personalized music
- Gift-givers seeking meaningful, one-of-a-kind presents

## Key Features

### 1. User Authentication & Management
- **Secure Registration/Login**: Email-based authentication via Supabase
- **Email Verification**: Secure account activation process
- **User Profiles**: Credit management and account settings
- **Dashboard**: Centralized hub for managing songs and account

### 2. Personalized Song Creation Workflow

#### Step 1: Basic Information
- Subject name (who the song is about)
- Relationship to the user (girlfriend, best friend, mom, etc.)

#### Step 2: Song Type Selection
- **Love Songs**: Express romantic feelings
- **Friendship Songs**: Celebrate friendships
- **Funny Songs**: Create lighthearted, humorous content
- **Dedication Songs**: Honor someone special
- **Special Celebrations**: General milestone celebrations
- **Holiday Songs**: Birthday, Mother's Day, Father's Day, Anniversary

#### Step 3: Detailed Personalization
- **Positive Attributes**: What you love about them
- **Inside Jokes & References**: Shared humor and memories
- **Special Places**: Meaningful locations
- **Special Moments**: Memorable experiences together
- **Unique Characteristics**: What makes them one-of-a-kind
- **Other People to Include**: Family members, friends to mention
- **Additional Details**: Occasion-specific information

#### Step 4: Musical Style Preferences
- **Genre Selection**: Pop, Rock, Country, Hip-Hop, R&B, Folk, Latin, Rap, and more
- **Custom Genres**: User-defined musical styles
- **Instruments**: Guitar, Piano, Drums, Violin, and custom instruments
- **Singer Preference**: Male or female vocals
- **Energy Level**: Low, medium, or high energy
- **Style Notes**: Additional musical preferences

### 3. AI-Powered Content Generation

#### Lyric Generation (OpenAI)
- Processes all user input into comprehensive prompts
- Generates contextual, personalized lyrics
- Incorporates specific details, memories, and characteristics
- Adapts tone based on song type and relationship

#### Music Generation (Mureka API)
- Creates multiple song variations from the same lyrics
- Supports both MP3 and FLAC audio formats
- Generates complete songs with professional quality
- Provides timing data for lyrics synchronization

### 4. Song Management & Storage

#### Dashboard Features
- **Song Library**: View all created songs
- **Status Tracking**: Monitor generation progress
- **Lyrics Viewer**: Read generated lyrics in formatted modal
- **Audio Players**: Built-in playback for all song variations
- **Download Options**: MP3 and FLAC format downloads
- **Song Editing**: Modify and regenerate existing songs
- **Deletion**: Remove unwanted songs with confirmation

#### Song Status Types
- **Pending**: Waiting to start generation
- **Processing**: Currently being generated
- **Completed**: Successfully generated with audio
- **Failed**: Generation encountered errors

### 5. Credit System
- **Pay-per-song Model**: Users purchase credits to create songs
- **Credit Tracking**: Real-time display of remaining credits
- **Test Credits**: Development feature for adding credits
- **Credit Deduction**: Automatic deduction upon song creation

### 6. Audio Features
- **Multiple Variations**: Each request generates 2+ song versions
- **Format Options**: MP3 (standard) and FLAC (high-quality)
- **Audio Players**: Integrated web-based playback
- **Download Management**: Direct download links with proper filenames
- **Duration Display**: Show song length for each variation

## Technical Architecture

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS for responsive design
- **UI Components**: Lucide React icons, custom components
- **State Management**: React hooks for local state

### Backend
- **API Routes**: Next.js API routes for server-side logic
- **Authentication**: Supabase Auth for user management
- **Database**: PostgreSQL via Supabase
- **File Storage**: CDN storage via external providers

### External APIs
- **OpenAI**: GPT-powered lyric generation
- **Mureka**: Professional music generation and synthesis
- **Supabase**: Authentication, database, and real-time features

### Database Schema
```sql
-- Users table (managed by Supabase Auth)
auth.users

-- User profiles
profiles (
  id: UUID (references auth.users)
  full_name: TEXT
  credits_remaining: INTEGER
  subscription_status: TEXT
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
)

-- Songs
songs (
  id: UUID
  user_id: UUID (references auth.users)
  title: TEXT
  status: TEXT
  questionnaire_data: JSONB
  generated_lyrics: TEXT
  audio_url: TEXT
  mureka_task_id: TEXT
  mureka_data: JSONB
  created_at: TIMESTAMP
  completed_at: TIMESTAMP
)
```

## User Experience Flow

### 1. Account Creation
1. User registers with email and password
2. Email verification sent
3. User clicks verification link
4. Account activated, redirected to dashboard

### 2. Song Creation
1. User clicks "Create New Song" (requires credits)
2. Completes 4-step questionnaire:
   - Basic info about song recipient
   - Selects song type and occasion
   - Provides detailed personal information
   - Chooses musical style preferences
3. System generates comprehensive AI prompt
4. Credits deducted, song record created
5. User redirected to generation page

### 3. Content Generation
1. **Lyric Generation**: OpenAI processes the prompt
2. **Progress Tracking**: Real-time status updates
3. **Music Generation**: Mureka creates multiple song variations
4. **Audio Processing**: Multiple formats generated
5. **Completion**: User can play, download, and share

### 4. Song Management
1. View all songs in dashboard
2. Read lyrics in detailed modal
3. Play different variations
4. Download preferred versions
5. Edit and regenerate if desired
6. Delete unwanted songs

## Security & Privacy

### Data Protection
- All user data encrypted in transit and at rest
- API keys securely stored in environment variables
- User authentication via secure JWT tokens
- Database access through service role keys

### Privacy Measures
- Personal information used only for song generation
- No sharing of user content with third parties
- Secure deletion of unwanted songs
- Data isolation between users

## Performance Features

### Optimization
- **Concurrent Processing**: Parallel API calls where possible
- **Caching**: Browser navigation prevention during song creation
- **Real-time Updates**: Live progress tracking during generation
- **Responsive Design**: Mobile-friendly interface
- **Error Handling**: Comprehensive error management and user feedback

### Browser Compatibility
- Modern web browsers with HTML5 audio support
- Progressive enhancement for older browsers
- Mobile-responsive design for all screen sizes

## Monetization Model

### Credit System
- Users purchase credits to create songs
- Each song creation costs 1 credit
- New users receive 1 free credit
- Additional credits available for purchase

### Future Expansion
- Subscription plans for regular users
- Bulk credit packages
- Premium features (faster generation, more variations)
- Commercial licensing options

## Development & Deployment

### Environment
- **Development**: Local Next.js development server
- **Production**: Vercel or similar hosting platform
- **Database**: Supabase cloud hosting
- **CDN**: Integrated with Mureka's content delivery

### Configuration
```bash
# Required Environment Variables
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-key
MUREKA_API_KEY=your-mureka-key
```

## Future Roadmap

### Phase 1 Enhancements
- Advanced audio controls (pause, seek, volume)
- Playlist creation for multiple songs
- Social sharing capabilities
- Mobile app development

### Phase 2 Features
- Collaborative song creation
- Video generation with lyrics
- Advanced musical arrangements
- Voice cloning options

### Phase 3 Expansion
- Multi-language support
- Professional mastering options
- Copyright and licensing management
- Artist collaboration platform

## Support & Maintenance

### User Support
- Comprehensive error messages
- Debug information for developers
- User-friendly confirmation dialogs
- Progress indicators for all operations

### Monitoring
- API usage tracking
- Error logging and alerting
- Performance monitoring
- User behavior analytics

---

*This specification represents the current state of Song Mint as of December 2024. Features and technical details may evolve based on user feedback and technological advances.*