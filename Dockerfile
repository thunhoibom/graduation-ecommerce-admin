# --- STEP 1: Build App ---
FROM node:22.22.0-alpine as build

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

COPY . .

# Set environment variables for build
ENV NODE_ENV=production
ENV CI=true

# Build the app
RUN yarn build

# --- STEP 2: Production Server ---
FROM node:22.22.0-alpine

# Set working directory
WORKDIR /app

COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

CMD ["node", "server.js"]