FROM node:16 as builder

WORKDIR /usr/app
COPY . .
RUN npm install
RUN npm run build

FROM liferay/node-runner:latest

WORKDIR /opt/liferay

COPY ./package*.json ./
RUN npm ci --only=production

COPY --from=builder /usr/app/dist ./
COPY ./.env .
COPY ./.env.production .

EXPOSE 4000
