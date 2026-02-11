# Build stage
FROM node:22-alpine AS builder

# Cache bust v2
WORKDIR /app

# Copy package files first
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install dependencies (before copying source to leverage cache)
RUN cd frontend && npm install
RUN cd backend && npm ci --production=false

# Copy ALL source files
COPY frontend/ ./frontend/
COPY backend/ ./backend/

# Build frontend
RUN cd frontend && npm run build

# Create public directory and copy built files
RUN mkdir -p backend/public && cp -r frontend/dist/* backend/public/

# Production stage
FROM node:22-alpine

WORKDIR /app

# Copy backend and built frontend from builder
COPY --from=builder /app/backend ./backend

# Install only production dependencies
RUN cd backend && npm ci --production

# Set working directory to backend
WORKDIR /app/backend

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
