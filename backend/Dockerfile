# --- Base Stage ---
FROM node:20-alpine AS base
WORKDIR /usr/src/app
COPY package*.json ./

# --- Development Stage ---
FROM base AS development
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]

# --- Production Stage ---
FROM base AS production
RUN npm ci --omit=dev
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
