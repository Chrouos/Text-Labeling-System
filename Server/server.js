const os = require('os');
const express = require('express');
const cors = require('cors');
const ConfigCrypto = require('./tools/ConfigCrypto')
const configCrypto = new ConfigCrypto();

// -------------------- App Settings
const app = express();
const interfaces = os.networkInterfaces();  // Retrieve all network interfaces on this machine
app.use(cors());
app.use(express.json()); // Parse the JSON request body

// -------------------- Server Settings
const port = configCrypto.config.PORT || 8280;
let hostname = configCrypto.config.HOSTNAME || 'localhost';

// -------------------- routers list
const processDataRouter = require('./routers/ProcessDataRouter')
app.use(processDataRouter);


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

app.listen(port, () => {
  console.log(`[Text-Labeling] Server listening at http://${hostname}:${port}`);
  console.log(`Set the environment to "${process.env.NODE_ENV}"`)
});


// -------------------- test

app.get('/', (req, res) => {
  res.send("Hello")
});
