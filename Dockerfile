FROM oven/bun:1.3
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source
COPY bunfig.toml tsconfig.json drizzle.config.ts ./
COPY src/ src/

ENV NODE_ENV=production
EXPOSE 3000

CMD ["bun", "run", "src/server.ts"]
