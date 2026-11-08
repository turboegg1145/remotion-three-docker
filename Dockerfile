# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive \
    REMOTION_GL=swangle

# Shared libraries required by Chrome Headless Shell, including the
# GL/Vulkan stack used by ANGLE + SwiftShader for software WebGL.
RUN apt-get update && apt-get install -y --no-install-recommends \
      libnss3 \
      libdbus-1-3 \
      libatk1.0-0 \
      libatk-bridge2.0-0 \
      libgbm-dev \
      libasound2 \
      libxrandr2 \
      libxkbcommon-dev \
      libxfixes3 \
      libxcomposite1 \
      libxdamage1 \
      libpango-1.0-0 \
      libcairo2 \
      libcups2 \
      libgl1 \
      libegl1 \
      libvulkan1 \
      libxshmfence1 \
      fonts-dejavu-core \
      ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install JS dependencies first so this layer is cached across source edits.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Download Chrome Headless Shell into the image at build time, so rendering
# never needs network access at runtime.
RUN npx remotion browser ensure

COPY tsconfig.json remotion.config.ts ./
COPY src ./src
COPY public ./public
COPY render.mjs ./

RUN mkdir -p /app/out
VOLUME ["/app/out"]

CMD ["npm", "run", "render"]
