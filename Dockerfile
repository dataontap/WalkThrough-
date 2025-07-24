FROM node:20-alpine

# Install Chrome
RUN apk add --no-cache chromium

# Environment variables
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy all files
COPY . .

# Build frontend only, skip server bundling
RUN vite build

# Create server directory in dist
RUN mkdir -p dist && cp -r server dist/

EXPOSE 5000

# Run server directly with tsx (no bundling)
CMD ["npx", "tsx", "server/index.ts"]
