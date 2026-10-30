FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends chromium ffmpeg ca-certificates fonts-dejavu-core fonts-noto-core && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build && node --import tsx scripts/build-video.mjs && mkdir -p /app/output && chown -R node:node /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3001 CHROME_PATH=/usr/bin/chromium OUTPUT_DIR=/app/output RENDER_BUNDLE_DIR=/app/dist/video
USER node
EXPOSE 3001
CMD ["npm", "start"]
