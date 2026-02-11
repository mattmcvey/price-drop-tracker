# Build stage
FROM node:22-alpine AS builder

WORKDIR /build

# Copy frontend
COPY ../frontend ./frontend
WORKDIR /build/frontend
RUN npm install && npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Copy backend package files
COPY package*.json ./
RUN npm ci --production

# Copy backend source
COPY . .

# Copy built frontend from builder
COPY --from=builder /build/frontend/dist ./public

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
