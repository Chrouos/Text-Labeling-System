#!/bin/bash

# 備份目標目錄
SOURCE_DIR="/home/testuser/huai/Text-Labeling-System/src/server/uploads"

# 備份目的地目錄
DEST_DIR="/home/testuser/huai/backup"

# 檢查並創建備份目的地目錄
mkdir -p "$DEST_DIR"

# 執行備份
rsync -av --delete "$SOURCE_DIR/" "$DEST_DIR/"

# 標註備份時間
date "+%Y-%m-%d %H:%M:%S" > "$DEST_DIR/backup_timestamp.txt"

# 輸出完成訊息
echo "備份完成。備份時間已標記於 $DEST_DIR/backup_timestamp.txt"
