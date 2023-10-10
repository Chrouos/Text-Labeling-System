# 建立 Docker 映像
docker build -t text-labeling:latest .

# 檢查是否存在名為 text-labeling 的 container，如果存在則刪除
docker rm -f text-labeling || true

# 運行新的 container
# docker run -d -p 4567:4567 --name text-labeling text-labeling
docker run -d -p 4567:4567 -p 24678:24678 --name text-labeling text-labeling
