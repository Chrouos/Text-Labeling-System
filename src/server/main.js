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
  res.json({
    HOSTNAME: hostname,
    PORT: port
  });
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