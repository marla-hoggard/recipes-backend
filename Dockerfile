# Use Node.js 22 LTS version
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy yarn lock file and package.json
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript
RUN yarn build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install only production dependencies
RUN yarn install --production --frozen-lockfile

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Expose the port your app runs on
EXPOSE 8080

# Start the application
CMD ["node", "dist/index.js"]
