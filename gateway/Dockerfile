FROM node:16-alpine

WORKDIR /usr/src/app

COPY package.json .

RUN npm install

ENV APOLLO_SCHEMA_CONFIG_EMBEDDED=true

RUN apk add certbot

COPY gateway.js .

COPY start.sh .

COPY supergraph.graphql /etc/config/supergraph.graphql

CMD ./start.sh
