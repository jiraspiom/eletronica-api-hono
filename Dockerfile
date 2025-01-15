
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN npm install -g typescript

COPY . .

RUN tsc

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
