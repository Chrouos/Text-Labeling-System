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

![截圖 2024-05-07 晚上9 30 58](https://github.com/Chrouos/Text-Labeling-System/assets/56072039/0fecd4d2-071d-4894-90aa-fbb0003d8aed)

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


[工作流程](https://github.com/Chrouos/Text-Labeling-System/blob/main/workflow.md)
