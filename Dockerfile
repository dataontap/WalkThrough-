FROM node:20-alpine

RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    CHROME_BIN=/usr/bin/chromium \
    NODE_ENV=production

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Debug: List files to ensure vite.config.ts exists
RUN ls -la vite.config.ts

# Build with verbose output for debugging
RUN npm run build || (echo "Build failed, listing files:" && ls -la && exit 1)

EXPOSE 5000
CMD ["npm", "start"]
