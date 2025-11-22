FROM node:20-alpine

WORKDIR /app

# Set environment variables to skip TypeScript checks
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_SKIP_TS_CHECK=1
# Set API URL for client-side code
ENV NEXT_PUBLIC_API_URL=/api

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build application (skip linting)
RUN npm run build -- --no-lint

# Expose port
EXPOSE 3000

# Start application in production mode
CMD ["npm", "start"] 