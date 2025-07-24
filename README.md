AI-Powered Walkthrough Recording Service

## Overview

An API-driven walkthrough automation platform that logs into web applications using provided credentials, records guided tutorials based on user prompts, and delivers video walkthroughs via email notifications.

## Key Features

- **Real Browser Automation** - Uses Puppeteer for actual screen recording
- **AI-Powered Scripts** - OpenAI GPT-4o with Gemini fallback for narration
- **Login Automation** - Automatic detection and filling of login forms
- **Video Generation** - MP4 downloads with file size warnings (10-50MB)
- **Emoji Mood Tracking** - User feedback system with difficulty/satisfaction ratings
- **AI Step Generation** - Converts descriptions into detailed action plans
- **Email Notifications** - Gmail integration for walkthrough delivery
- **Multi-Application Support** - Works with any web application

## Technology Stack

- **Frontend**: React with TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js with Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Browser Automation**: Puppeteer with Chrome
- **AI Integration**: OpenAI API, Google Gemini AI
- **Email**: Gmail SMTP with app passwords

## API Endpoints

- `POST /api/record` - Create recording request
- `GET /api/record/:sessionId/status` - Check recording progress
- `GET /api/recordings/:sessionId.mp4` - Stream video
- `GET /api/recordings/:sessionId/download` - Download video
- `GET /api/health` - Health check for production

## Production Deployment

This project is configured for Render deployment with real Chrome browser automation:

### Files for Deployment:
- `Dockerfile` - Chrome installation and configuration
- Health check endpoint configured at `/api/health`

### Environment Variables Required:
- `NODE_ENV=production`
- `OPENAI_API_KEY` - For AI script generation
- `GEMINI_API_KEY` - For AI fallback system
- `GMAIL_USER` - For email notifications (optional)
- `GMAIL_APP_PASSWORD` - For email authentication (optional)

### Deploy to Render:
1. Push this repository to GitHub
2. Sign up at https://render.com with GitHub
3. Create new Web Service from GitHub repo
4. Set build command: `npm run build`
5. Set start command: `npm start`
6. Add environment variables
7. Real video recording starts immediately

## Development

```bash
npm run dev    # Start development server
npm run build  # Build for production
npm start      # Run production build
```

## Cost After Deployment
- Render Starter Plan: $7/month
- Unlimited recordings with real browser automation
- No per-recording charges
