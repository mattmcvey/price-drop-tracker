# Build frontend
FROM node:22-alpine AS frontend-builder

WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Build backend
FROM node:22-alpine

WORKDIR /app

# Copy backend files
COPY backend/package*.json ./
RUN npm install --production

COPY backend/ ./

# Copy built frontend
RUN mkdir -p public
COPY --from=frontend-builder /frontend/dist ./public

EXPOSE 3000

CMD ["npm", "start"]
