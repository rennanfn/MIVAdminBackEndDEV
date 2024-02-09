#Docker file para build Node + React.
#Utilizando imagem node:bullseye-slim para teste, mais leve

FROM node:18.14.2-alpine as dependencies
ENV TZ="America/Sao_Paulo"
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm i


FROM node:18.14.2-alpine as builder
RUN apk add tzdata
ENV TZ="America/Sao_Paulo"
WORKDIR /app
COPY . .
COPY --from=dependencies /app/node_modules ./node_modules
RUN npm run build

FROM node:18.14.2-alpine as runner
RUN apk add tzdata
WORKDIR /app
ENV TZ="America/Sao_Paulo"

#ENTRYPOINT PARA RODAR AS CRONS
COPY set_timezone.sh ./set_timezone.sh
RUN chmod +x set_timezone.sh



## If you are using a custom next.config.js file, uncomment this line.
# COPY --from=builder /my-project/next.config.js ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/dist ./dist
COPY src ./src
#COPY main.js main.js
# RUN mkdir public
RUN ln -s /app/src/storage public

COPY .env-dev .env

EXPOSE 3333
CMD ["sh", "-c", "./set_timezone.sh && npm start"]

