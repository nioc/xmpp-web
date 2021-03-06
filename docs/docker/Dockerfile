# build stage
FROM node:lts-alpine as build-stage
RUN apk add git
# copy package
WORKDIR /app
COPY package*.json ./
# install dependencies
RUN npm install
# copy src and assets
COPY . .
# build
RUN npm run build

# production stage
FROM nginx:stable-alpine as production-stage
# copy html files
COPY --from=build-stage /app/dist /usr/share/nginx/html
# copy nginx conf
COPY ./docs/docker/998-update-local.js.sh /docker-entrypoint.d/998-update-local.js.sh
COPY ./docs/docker/default.conf.template /etc/nginx/templates/default.conf.template
# set environment variables
ENV APP_NAME=
ENV APP_HTTP=http://localhost/http-bind
ENV APP_WS=ws://localhost/xmpp-websocket
ENV APP_REGISTERED_ACCESS=1
ENV APP_GUEST_ACCESS=1
ENV XMPP_ANON_HOST=
ENV APP_IS_TRANSPORTS_USER_ALLOWED=0
ENV APP_HTTP_AUTODISCOVERY=0
ENV APP_RESOURCE=
ENV APP_DEFAULT_DOMAIN=localhost
ENV APP_DEFAULT_MUC=
ENV APP_IS_STYLING_DISABLED=0
ENV XMPP_HTTP=http://localhost:5280/http-bind
ENV XMPP_WS=http://localhost:5280/xmpp-websocket
EXPOSE 80/tcp