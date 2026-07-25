FROM node:20-alpine
WORKDIR /app
COPY . .
RUN mkdir -p /data && chown -R node:node /app /data
USER node
ENV NODE_ENV=production PORT=4184 RUNTIME_DIR=/data
EXPOSE 4184
CMD ["node", "server-production-v12.js"]
