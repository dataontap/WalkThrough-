FROM node:20-alpine

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    CHROME_BIN=/usr/bin/chromium

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Key fix: Set NODE_ENV before build
ENV NODE_ENV=production
RUN npm run build

EXPOSE 5000
CMD ["npm", "start"]
