# Multi-stage build
FROM node:20-slim as builder

WORKDIR /app

# Copy everything except node_modules
COPY package*.json .npmrc ./
COPY src ./src
COPY vite.config.ts tsconfig.json tsconfig.node.json ./
COPY backend ./backend

# Install frontend dependencies and build
RUN npm ci --omit=dev && npm run build

# Create runtime stage
FROM node:20-slim

WORKDIR /app

# Copy frontend build from builder
COPY --from=builder /app/dist ./dist

# Copy backend
COPY --from=builder /app/backend ./backend

WORKDIR /app/backend

# Install backend production dependencies only
COPY --from=builder /app/backend/package*.json ./
RUN npm ci --omit=dev

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "server.js"]
