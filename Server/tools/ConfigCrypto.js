const CryptoJS = require('crypto-js')
const defaultConfig = require('../config/' + process.env.NODE_ENV + ".js"); 

class CryptoJS_AES {

    constructor(){
        this.config = defaultConfig;

        // 將原本加密的 Config 文件進行解密
        this.decryptConfig(this.config);
    }

    decryptConfig(Config){
        // Verify "Config" is of type object
        if (typeof Config !== 'object'){ return ; }

        for (const key in Config){
            
            // Verify "key" is in "Config" object
            if (Config.hasOwnProperty(key)){
                const value = Config[key];

                if (typeof value === 'string') {
                    if (value.indexOf('ENC(') === 0 && value.lastIndexOf(')') === value.length - 1) {
                        const encryptMsg = value.substring(4, value.length - 1);
                        Config[key] = CryptoJS.AES.decrypt(encryptMsg, "").toString(CryptoJS.enc.Utf8)
                    }
                }
            }
        }
    }


}


module.exports = CryptoJS_AES;

// https://www.letswrite.tw/crypto-js/
