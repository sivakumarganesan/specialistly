# Multi-stage build
FROM node:20-slim as builder

WORKDIR /app

# Copy all source files
COPY . .

# Install ALL dependencies (including dev for build)
RUN npm ci && npm run build

# Create runtime stage
FROM node:20-slim

WORKDIR /app

# Copy frontend dist from builder
COPY --from=builder /app/dist ./dist

# Copy backend with dependencies
COPY --from=builder /app/backend ./backend

WORKDIR /app/backend

# Install backend production dependencies only
RUN npm ci --omit=dev

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "server.js"]
