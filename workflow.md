### 01/22
+ 增加高光部分
    + 關鍵字高光：適用於任何狀況
    + 標記高光：只適用於「cleanJudgement」
        + 需注意只有在 cleanJudgement 才會紀錄 start_position, end_position. 其他檔案不適用
    + 比對高光：只適用於「cleanJudgement」
        + 比對高光是根據 start_position, end_position 做的輸出
    + 預設只有關鍵字高光
    + 按下 Z 可以看到高光的 Key
    + Can download compare CSV. 

### 01/08
+ 修改 Excel 下載方式 => 可以比對多個人的 Excel (只要同檔名)
+ 加入關鍵字 HightLight

### 01/07
+ `git update-index --assume-unchanged ./src/server/config/development.js`
+ `git update-index --assume-unchanged ./src/client/utils/index.tsx`
+ `git update-index --assume-unchanged ./src/server/config/loginAccount.js`
+ 增加 admin 權限

### 12/22
+ Bug 排除
+ 優化程式碼時間複雜度與空間複雜度

### 12/20
+ 刪除欄位二次確認
+ 增加排序功能

### 12/19
+ 自動存擋
+ Loading 防止資料遺失 + 自動儲存開關


### 12/17
+ 選取後資料可以自動偵測滾動


### 12/13
+ 增加 Card 取消選取困難，固定 Card 的標題不一定
    + 背景白色，透明度 0.8
+ 修改 run.sh 讓其在 Docker 活動時與本地端檔案連通 (-v)
