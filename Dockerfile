FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache tini && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 hono

COPY package.json pnpm-lock.yaml src ./
RUN npx pnpm i && npx pnpm prune --production

ENTRYPOINT ["/sbin/tini", "--"]
EXPOSE 3000

USER hono
CMD ["node", "/app/index.js"]