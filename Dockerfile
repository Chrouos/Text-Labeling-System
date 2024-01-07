# 使用官方 Node.js 基礎映像
FROM node:20

# 設定工作目錄
WORKDIR /usr/src/app

# 複製 package.json 和 yarn.lock 到工作目錄
COPY package*.json yarn.lock ./


# 安裝依賴
RUN npm install -g nodemon && npm install && yarn install


# 複製其他源碼到工作目錄
COPY . .

EXPOSE 4567 24678

# 設定啟動指令
CMD [ "yarn", "dev" ]

# docker build -t text-labeling:latest .
# docker run  -d -p 4567:4567 --name text-labeling text-labeling



