FROM node:18-alpine

WORKDIR /app

# Install necessary packages including Python for native dependencies
RUN apk add --no-cache curl netcat-openbsd openssl python3 make g++ dos2unix

# Copy package files first for better caching
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including nodemon for development)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Create logs and uploads directories
RUN mkdir -p logs uploads

# Fix permissions for non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001 -G nodejs && \
    chown -R nodeuser:nodejs /app

USER nodeuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Use nodemon for development hot reload
CMD ["npm", "run", "dev"]