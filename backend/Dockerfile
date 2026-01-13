# backend/Dockerfile
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies for Puppeteer/Chrome
RUN apk add --no-cache \
    libc6-compat \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Tell Puppeteer to use the installed Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Development stage
FROM base AS development
COPY package*.json ./
RUN npm install --prefer-offline --no-audit
COPY . .
# Ensure templates directory exists and copy templates after build
RUN mkdir -p dist/templates/email
EXPOSE 3000
CMD ["sh", "-c", "npm run build && cp -r src/templates/* dist/templates/ 2>/dev/null || true && npm run start:dev"]

# Build stage
FROM base AS builder
COPY package*.json ./
RUN npm install --prefer-offline --no-audit
COPY . .
RUN npm run build
# Copy templates to dist folder
RUN mkdir -p dist/templates && cp -r src/templates/* dist/templates/ 2>/dev/null || true

# Production stage
FROM base AS production
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --prefer-offline --no-audit --production && npm cache clean --force
COPY --from=builder /app/dist ./dist
EXPOSE 3000
USER node
CMD ["node", "dist/main.js"]
