# Chrome Path Fix for Render

## Root Issue
Chromium on Alpine Linux is installed as `/usr/bin/chromium`, not `/usr/bin/chromium-browser`. Your Render deployment is looking for the wrong executable path.

## Quick Fix for GitHub

### 1. Update server/recording.ts
Find this line (around line 406):
```javascript
executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_BIN || '/usr/bin/chromium-browser',
```

Change to:
```javascript
executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_BIN || '/usr/bin/chromium',
```

### 2. Update Dockerfile
Find this section:
```dockerfile
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    CHROME_BIN=/usr/bin/chromium-browser \
    DISPLAY=:99
```

Change to:
```dockerfile
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    CHROME_BIN=/usr/bin/chromium \
    DISPLAY=:99
```

## Alpine Linux Chrome Facts
- ✅ Alpine installs Chromium as `/usr/bin/chromium`
- ❌ There is no `/usr/bin/chromium-browser` by default
- ✅ The `chromium` package provides the browser executable

## Steps to Fix:
1. Go to your GitHub repository: `dataontap/WalkThrough`
2. Edit `server/recording.ts` - change the executable path
3. Edit `Dockerfile` - update environment variables
4. Commit: "Fix Chromium executable path for Alpine Linux"
5. Render will automatically redeploy with working Chrome

This will resolve the `spawn /usr/bin/chromium-browser ENOENT` error.