FROM node:22 AS client-build

WORKDIR /pomodoroGame/client

COPY client/package*.json ./

ENV npm_config_jobs=1
ENV NODE_OPTIONS=--max-old-space-size=1024

RUN npm ci

COPY client/ ./

RUN npm run build


FROM node:22

WORKDIR /pomodoroGame/server

COPY server/package*.json ./

ENV npm_config_jobs=1
ENV NODE_OPTIONS=--max-old-space-size=1024

RUN npm ci

COPY server/ ./

COPY --from=client-build /pomodoroGame/client/dist ./public

EXPOSE 5000

CMD ["node", "index.js"]
