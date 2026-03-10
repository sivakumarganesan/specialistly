# Multi-stage Docker build
# Stage 1: Build frontend and prepare backend dependencies
FROM node:20-slim as builder

WORKDIR /app

# Copy all source files
COPY . .

# Install all dependencies for frontend build
RUN npm install

# Build frontend with Vite
RUN npm run build

# Install backend dependencies
WORKDIR /app/backend
RUN npm install

# Stage 2: Runtime image with just the app
FROM node:20-slim

WORKDIR /app

# Copy compiled frontend from builder
COPY --from=builder /app/dist ./dist

# Copy backend code with node_modules
COPY --from=builder /app/backend ./backend

WORKDIR /app/backend

# Expose port
EXPOSE 5000

# Start the backend server
CMD ["node", "server.js"]
