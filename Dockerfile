# Use the official Bun image
FROM oven/bun:1-slim

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

# Copy source code
COPY . .

# Run the application
CMD ["bun", "run", "index.ts"]
