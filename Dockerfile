FROM node:alpine

WORKDIR /app

COPY . .

RUN npm install -g pnpm

RUN pnpm i

RUN pnpm build

CMD ["pnpm", "start"]
