# ============================================================
# 第一阶段：构建编译 - 安装所有依赖项
# ============================================================
FROM node:22.16.0-alpine3.22 AS builder

# 设置工作目录
WORKDIR /usr/src/app

# 将内容复制到工作目录
COPY . .

# 安装依赖项
RUN npm install -g npminstall --registry=https://registry.npmmirror.com \
  && npminstall -c \
  && npm run tsc:prod -- --declaration false \
  && cp ./app/port/*.html ./dist/app/port/ \
  && cp ./app/port/*.json ./dist/app/port/ \
  && cp ./package*.json ./dist/

# ============================================================
# 第二阶段：生产运行 - 仅安装运行时依赖项
# ============================================================
FROM node:22.16.0-alpine3.22

# 设置工作目录
WORKDIR /usr/src/app

# 复制编译后的文件
COPY --from=builder /usr/src/app/dist ./

# 安装依赖项
RUN npm install -g npminstall --registry=https://registry.npmmirror.com \
  && npminstall husky \
  && npminstall -c --production

# 添加环境变量
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