# Render Deployment Guide - WalkThrough Platform

## Quick Deployment Steps

### 1. GitHub Repository Setup
Your code is ready! Just push to GitHub:
```bash
git add .
git commit -m "Complete WalkThrough platform for Render deployment"
git push origin main
```

### 2. Deploy on Render
1. **Go to**: https://render.com
2. **Sign up**: With your GitHub account
3. **New Web Service**: Connect your GitHub repository
4. **Settings**:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Port**: `5000`
   - **Environment**: Node

### 3. Environment Variables on Render
Set these in your Render service:
- `NODE_ENV=production`
- `OPENAI_API_KEY=your_openai_key`
- `GEMINI_API_KEY=your_gemini_key`
- `GMAIL_USER=your_gmail_address` (optional)
- `GMAIL_APP_PASSWORD=your_gmail_app_password` (optional)

## What You Get After Render Deployment

✅ **Real Chrome browser automation** - Puppeteer with Chromium
✅ **Actual screen recordings** - No more demo videos
✅ **Login automation** - Username/password field detection
✅ **Video downloads** - MP4 files with file size warnings
✅ **AI script generation** - OpenAI GPT-4 with Gemini fallback
✅ **Email notifications** - Gmail integration
✅ **Health checks** - `/api/health` endpoint for monitoring

## Cost on Render
- **Free Tier**: Available for testing
- **Starter Plan**: $7/month for production
- **No usage limits** on recordings
- **500GB bandwidth** included

Your live app will be: `https://your-app-name.onrender.com`

## Troubleshooting

**If Chrome issues occur:**
- Render automatically includes Chrome dependencies
- Your Dockerfile handles Chrome installation
- Check logs for Puppeteer errors

**If build fails:**
- Verify `npm run build` works locally
- Check all environment variables are set
- Review Render build logs