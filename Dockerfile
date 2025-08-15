FROM node:18 AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --ignore-scripts

COPY . .

RUN npm run build

FROM node:18-slim AS production

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

RUN chown -R www-data:www-data /tmp
USER www-data

ENV NODE_ENV production

CMD ["node", "dist/main.js"]