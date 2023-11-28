## Start.

`npm install`

```
yarn dev
```

+ 可以增加想要標記的欄位
+ 前後文擷取


![image](https://github.com/Chrouos/Text-Labeling-System/assets/56072039/98c837de-449d-4a88-86e7-1342a5ad8f41)



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
