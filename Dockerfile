# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine

# Install Chrome dependencies and Chromium browser
RUN apk add --no-cache \
    chromium \
    chromium-chromedriver \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    dbus \
    xvfb \
    && rm -rf /var/cache/apk/*

# Set Chrome path for Puppeteer and create necessary directories
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    CHROME_BIN=/usr/bin/chromium-browser \
    DISPLAY=:99

# Set working directory
WORKDIR /app

# Create Chrome user data directory
RUN mkdir -p /app/.chrome && chmod 755 /app/.chrome

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies after build to reduce image size
RUN npm prune --production

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"]
```

### 2. server/recording.ts
Find this section (around line 404):

```javascript
browser = await puppeteer.launch({
  headless: false,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-web-security',
    '--allow-running-insecure-content',
    '--window-size=1280,720'
  ]
});
```

Replace it with:

```javascript
browser = await puppeteer.launch({
  headless: "new",
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_BIN || '/usr/bin/chromium-browser',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-web-security',
    '--allow-running-insecure-content',
    '--window-size=1280,720',
    '--disable-gpu',
    '--disable-features=VizDisplayCompositor',
    '--user-data-dir=/app/.chrome',
    '--single-process'
  ]
});
