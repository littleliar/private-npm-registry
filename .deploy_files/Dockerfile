# Phase I: Build Compilation - Install all dependencies
FROM node:22.14.0-alpine3.21 AS builder

# Set up the working directory
WORKDIR /usr/src/app

# Copy the content to the working directory
COPY . .

# Install dependencies
RUN npm install -g npminstall --registry=https://registry.npmmirror.com \
&& npminstall -c \
&& npm run tsc:prod -- --declaration false \
&& cp ./app/port/*.html ./dist/app/port/ \
&& cp ./app/port/*.json ./dist/app/port/ \
&& cp ./package*.json ./dist/

# Phase II: Production Run - Install only runtime dependencies
FROM node:22.14.0-alpine3.21

# Set up the working directory
WORKDIR /usr/src/app

# Copy the compiled files
COPY --from=builder /usr/src/app/dist ./

# Install dependencies
RUN npm install -g npminstall --registry=https://registry.npmmirror.com \
&& npminstall -c --production

# Add environment variables
ENV NODE_ENV=production EGG_SERVER_ENV=prod \
CNPMCORE_CONFIG_SOURCE_REGISTRY=https://registry.npmmirror.com \
CNPMCORE_CONFIG_SOURCE_REGISTRY_IS_CNPM=true \
CNPMCORE_CONFIG_REGISTRY=http://localhost:7001 \
CNPMCORE_CONFIG_ENABLE_WEB_AUTHN=true \
CNPMCORE_DATABASE_TYPE=MySQL \
CNPMCORE_DATABASE_NAME=cnpmcore \
CNPMCORE_DATABASE_HOST=localhost \
CNPMCORE_DATABASE_PORT=3306 \
CNPMCORE_DATABASE_USER=root \
CNPMCORE_REDIS_PORT=6379 \
CNPMCORE_REDIS_HOST=localhost \
CNPMCORE_REDIS_DB=0 \
CNPMCORE_NFS_TYPE=local \
TZ=Asia/Shanghai

EXPOSE 7001
CMD ["npm", "run", "start:foreground"]