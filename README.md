## Start.

`npm install`

```
yarn dev
```

+ 可以增加想要標記的欄位
+ 前後文擷取

![截圖 2023-09-25 上午8 12 31](https://github.com/Chrouos/Text-Labeling/assets/56072039/f315ecc3-0132-45e2-9d84-f99b2bcf4e40)


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
