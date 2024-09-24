FROM node:22-alpine AS builder
RUN mkdir /app
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build


FROM node:22-alpine AS production
WORKDIR /app
COPY --from=builder /app/package*.json /app/
COPY --from=builder /app/dist /app/dist
RUN npm ci --only=production
ENV NODE_ENV=production
EXPOSE 4000
CMD [ "npm", "run", "start" ]