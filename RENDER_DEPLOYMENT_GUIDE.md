# Render Deployment Quick Fix

## Current Issue: SIGTERM on Startup
Your app is getting killed during startup on Render. This is typically due to:
1. Long build times causing timeout
2. Missing Chrome dependencies
3. Memory/resource constraints

## Immediate Fix Steps

### 1. Update GitHub Repository
Commit these exact changes to https://github.com/dataontap/WalkThrough:

**File: Dockerfile**
```dockerfile
# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine

# Install Chrome dependencies and Chromium browser
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Set Chrome path for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    CHROME_BIN=/usr/bin/chromium

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
```

**File: server/recording.ts** (line 406)
```javascript
executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_BIN || '/usr/bin/chromium',
```

### 2. Render Service Settings
In your Render dashboard:
- **Build Command**: `npm ci && npm run build`
- **Start Command**: `npm start`
- **Environment**: Node
- **Instance Type**: Starter (or higher)

### 3. Environment Variables on Render
Set these in your Render service:
- `DATABASE_URL`: (your Neon PostgreSQL URL)
- `OPENAI_API_KEY`: (your OpenAI key)
- `GEMINI_API_KEY`: (your Gemini key)  
- `GMAIL_USER`: (your Gmail address)
- `GMAIL_APP_PASSWORD`: (your Gmail app password)
- `NODE_ENV`: production

## Alternative: Simplified Docker
If issues persist, try this minimal Dockerfile:

```dockerfile
FROM node:20-alpine

RUN apk add --no-cache chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build

EXPOSE 5000
CMD ["npm", "start"]
```

## Expected Result
After these changes:
- ✅ Chrome will be found at `/usr/bin/chromium`
- ✅ App will start without SIGTERM errors
- ✅ Recording API will work properly
- ✅ Video generation will function

Commit message: "Fix Chrome path and startup issues for Render deployment"