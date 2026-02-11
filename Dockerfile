# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy everything first
COPY . .

# Debug: List what was copied
RUN ls -la && echo "=== Frontend ===" && ls -la frontend/ || echo "Frontend not found" && echo "=== Backend ===" && ls -la backend/ || echo "Backend not found"

# Install dependencies
RUN cd frontend && npm install
RUN cd backend && npm ci --production=false

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
