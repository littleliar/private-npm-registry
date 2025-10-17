#### 1. 复制环境变量文件

`cp .deploy_files/.env.example .deploy_files/.env`

按需修改 .env 文件中的变量 `CNPMCORE_CONFIG_REGISTRY` 和 `CNPMCORE_STORAGE` 以及 `APP_VERSION`

#### 2. 复制 config.prod.ts 文件

`cp .deploy_files/config.prod.ts config/config.prod.ts`

#### 3. 构建前端镜像

`docker build -t cnpmcore:APP_VERSION -f .deploy_files/Dockerfile .`

#### 4. 启动数据库服务

`docker compose -f .deploy_files/docker-compose-db.yml up -d`

#### 5. 启动后端服务

`docker compose -f .deploy_files/docker-compose-web.yml up -d`
