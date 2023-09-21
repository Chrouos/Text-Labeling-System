const ConfigCrypto = require('../tools/ConfigCrypto')

// ----------------- 生成事件經過
exports.uploadTheFile = async (req, res) => {
    try {
     
        res.status(200).send("Completed!");
    }
    catch (error) {
        res.status(500).send(`[uploadTheFile] Error : ${error.message || error}`);
    }
}

