# Final Render Deployment Fix

## Root Issue Identified
The error `Cannot find package 'vite' imported from /app/dist/index.js` occurs because:

1. **Vite is required at runtime** - Your server setup imports Vite for SSR
2. **Production build excludes dev dependencies** - Dockerfile was removing Vite after build
3. **Server needs Vite to run** - Not just for building, but for serving the app

## Exact Fix for GitHub

### Update Dockerfile
Replace the entire Dockerfile with this corrected version:

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

# Install ALL dependencies (Vite needed at runtime)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
```

### Update server/recording.ts
Line 406 should be:
```javascript
executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_BIN || '/usr/bin/chromium',
```

## Why This Fixes Both Issues

1. **✅ Vite Runtime Error**: Keeps Vite installed for server operations
2. **✅ Chrome Path Error**: Uses correct `/usr/bin/chromium` path
3. **✅ SIGTERM Issues**: Lighter build process with proper dependencies
4. **✅ Production Ready**: All required packages available at runtime

## Commit and Deploy

1. **Commit message**: "Fix Vite runtime dependency and Chrome path for Render"
2. **Push to GitHub**: Render will auto-redeploy
3. **Expected result**: App starts successfully without errors

## Alternative: Emergency Dockerfile
If you need the absolute minimal version:

```dockerfile
FROM node:20-alpine
RUN apk add --no-cache chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

This keeps all dependencies and ensures both Vite and Chrome work correctly.