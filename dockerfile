# --- Stage 1: Build ---
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

# Install dependencies 
RUN npm install

# Copy  source code
COPY . .

# Build TypeScript to JavaScript (folder dist)
RUN npm run build

# --- Stage 2: Production Run ---
FROM node:18-alpine

WORKDIR /app

# Copy package.json 
COPY package*.json ./

RUN npm install --only=production

COPY --from=builder /app/dist ./dist


COPY --from=builder /app/src/scripts ./src/scripts


EXPOSE 3000

CMD ["node", "dist/server.js"]



