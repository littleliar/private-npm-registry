## 添加环境变量文件

`cp .deploy_files/.env.example .deploy_files/.env`

## 复制 config.prod.ts 文件

`cp .deploy_files/config.prod.ts.example config/config.prod.ts`

## 构建前端镜像

构建镜像时，需注意将 `package.json` 中的 `scripts` 的 `prepare` 脚本注释掉

`docker build -t cnpmcore:latest -f .deploy_files/Dockerfile .`

## 启动数据库服务

`docker compose -f .deploy_files/docker-compose-db.yml up -d`

## 启动后端服务

`docker compose -f .deploy_files/docker-compose-web.yml up -d`
