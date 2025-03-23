# Introduction

這是一個 Text Labeling System（文本標註系統）專案，旨在提供一個基於 Web 的平台，用於文本數據的標註與管理。
本專案提供了一個可視化的文本標註系統，方便使用者對文本數據進行標註（Labeling），並能夠高效地管理與導出標註結果。適用於 自然語言處理（NLP） 領域的數據標註需求，如情感分析、命名實體識別（NER）、文本分類等。

+ React.js + Tailwind CSS
+ DEMO: https://www.youtube.com/watch?v=KUk8dXSq1tI

## Start.

`npm install`

```
yarn dev
```

+ 可以增加想要標記的欄位
+ 前後文擷取
+ 擷取後的文章會高量化
+ 如果有多人可以進行比對

### 如果使用 Docker
```
chomd +x run.sh # 先把 run.sh 轉成可以啟動的模式
./run.sh
```

![截圖 2025-03-19 晚上11 00 08](https://github.com/user-attachments/assets/6d6aca2d-07ab-4dcf-a0cb-754d3df678ec)


## Error

> 遭遇問題: 'ws://localhost:4000/ws' failed:  
> `docker run -d -p 4567:4567 -p 24678:24678 --name text-labeling text-labeling`  
> ```
> # vite.config.js
>
>   server: {
>     host: "0.0.0.0",
>     strictPort: true,
>     hmr: {
>      protocol: 'ws',
>      host: '140.  115.54.36',
>      port: 443
>    }
> },
> ```


---

#  📌 適用場景

學術研究：NLP 領域的數據標註，訓練機器學習模型。  
企業應用：客服文本、用戶回饋分析、輿情監控等。  
教育與學習：作為 NLP 課程的標註工具。  

# 📢 聯絡與貢獻
歡迎貢獻本專案！若有任何問題，請提交 Issue 或 Pull Request。

📌 GitHub Repo： Text Labeling System

[工作流程](https://github.com/Chrouos/Text-Labeling-System/blob/main/workflow.md)
