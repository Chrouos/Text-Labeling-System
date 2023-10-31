const os = require('os');
const cors = require('cors');
const express = require("express");
var bodyParser = require('body-parser');            
const ViteExpress = require("vite-express");

const ConfigCrypto = require('./tools/ConfigCrypto')
const configCrypto = new ConfigCrypto();

const app = express();
const interfaces = os.networkInterfaces();  // Retrieve all network interfaces on this machine
app.use(cors());
app.use(bodyParser.json({limit:'50mb'})); 
app.use(bodyParser.urlencoded({extended:true, limit:'50mb'})); 
app.use(express.json()); // Parse the JSON request body

// -------------------- Server Settings
const port = configCrypto.config.PORT || 8280;
let hostname = configCrypto.config.HOSTNAME || 'localhost';
app.get('/api/config', (req, res) => {

  const response = {
    HOSTNAME: hostname,
    PORT: port
  }
  res.json(response);
});

// -------------------- routers list --------------------
const processDataRouter = require('./routers/ProcessDataRouter')
app.use(processDataRouter);


// -------------------- vite listen --------------------
ViteExpress.listen(app, 4567, () => {
  // 檢查每個網絡接口，並尋找 IPv4 地址
  if (hostname === 'localhost') {
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if ('IPv4' === iface.family && !iface.internal) {
          hostname = iface.address;
        }
      }
    }
  } 
  console.log(`[Text-Labeling-Server-Client] Server listening at http://${hostname}:${port}`);
  console.log("Server is listening on port 4567...")
});

// -------------------- Initialization --------------------
app.get("/api", (req, res) => {
  res.send("Api in the like way!");
});












const chinese_to_int = (text) => {
  const num_dict = {
    '零': '0', '０': '0',
    '壹': '1', '一': '1', '１': '1',
    '貳': '2', '二': '2', '２': '2',
    '參': '3', '三': '3', '叁': '3', '参': '3', '３': '3',
    '肆': '4', '四': '4', '４': '4',
    '伍': '5', '五': '5', '５': '5',
    '陸': '6', '六': '6', '６': '6',
    '柒': '7', '七': '7', '７': '7',
    '捌': '8', '八': '8', '８': '8',
    '玖': '9', '九': '9', '９': '9',
  };
  
  let process_text = '';
  
  for(let i = 0; i < text.length; i++) {
    const char_index = text[i];
    if (num_dict.hasOwnProperty(char_index)) {
      process_text += num_dict[char_index];
    } else {
      process_text += char_index;
    }
  }
  
  return process_text;
}

function is_number(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}


const translate = (input_str) => {

  // @ 未輸入任何東西
  if (input_str === "") { return 0; }

  // @ 變數區
  let result_arabic = 0;
  let temp_arabic = null;
  let unit = 1;  // 單位（十、百、千、萬）
  
  // @ 轉換中文到數字
  for (let index = 0; index < input_str.length; index ++){
    
    const char = input_str[index];
    
    // @ 若不需要轉換就先存起來跳過
    if (is_number(char)) temp_arabic += char

    else {
      
      if (temp_arabic === null) temp_arabic = 1;

      // @ 選擇單位
      if (char === '萬') unit = 10000
      else if (char === '仟' || char === '千') unit = 1000;
      else if (char === '佰' || char === '百') unit = 100;
      else if (char === '拾' || char === '十') unit = 10;

      result_arabic += temp_arabic * unit;
      console.log("🚀 ~ file: main.js:128 ~ translate ~ unit:", unit)
      console.log("🚀 ~ file: main.js:128 ~ translate ~ temp_arabic:", temp_arabic)
      temp_arabic = null;
      unit = 1;

      if (temp_arabic) {
        result_arabic += parseInt(tmp) * unit;
      }

    }

  }
  
  return result_arabic;
}


console.log(translate(chinese_to_int("壹千五佰玖")))
console.log(translate(chinese_to_int("壹千五佰玖十")))
console.log(translate(chinese_to_int("壹千五佰零玖")))
console.log(translate(chinese_to_int("壹千五")))

console.log(translate(chinese_to_int("1千502")))
console.log(translate(chinese_to_int("十五")))