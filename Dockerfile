FROM node:18 AS builder

WORKDIR /app

COPY package*.json ./
COPY .env ./

RUN npm ci --ignore-scripts

COPY . .

RUN npm run build

FROM node:18-slim AS production

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.env .env

RUN chown -R www-data:www-data /tmp
USER www-data

CMD ["node", "dist/main.js"]