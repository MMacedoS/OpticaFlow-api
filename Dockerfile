FROM node:22-alpine

WORKDIR /app

ENV TZ=America/Sao_Paulo

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
