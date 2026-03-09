# Multi-stage Docker build
# Stage 1: Build frontend and prepare app
FROM node:20-slim as builder

WORKDIR /app

# Copy all source files
COPY . .

# Install all dependencies (dev deps needed for Vite build)
RUN npm ci

# Build frontend with Vite
RUN npm run build

# Stage 2: Runtime image with just the app
FROM node:20-slim

WORKDIR /app

# Copy compiled frontend from builder
COPY --from=builder /app/dist ./dist

# Copy backend code and package files
COPY backend/package*.json ./backend/
COPY --from=builder /app/backend ./backend

WORKDIR /app/backend

# Install backend dependencies (production and any needed for runtime)
RUN npm ci

# Expose port
EXPOSE 5000

# Start the backend server
CMD ["node", "server.js"]
