# syntax=docker/dockerfile:1
#
# Imagen de PRODUCCIÓN para Railway.
# Contexto de build: el directorio `backend/` (en Railway, Root Directory = backend).
# NO usar Docker para desarrollo local. En Linux Mint se corre Node nativo:
#   cd backend && npm install && npm run start:dev

FROM node:24-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS build
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache libc6-compat \
  && addgroup -S nestjs \
  && adduser -S nestjs -G nestjs
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
USER nestjs
EXPOSE 3000
CMD ["node", "dist/main.js"]
