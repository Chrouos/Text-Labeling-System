const ConfigCrypto = require('../tools/AccountCrypto')

// const fs = require('fs')
// const path = require('path')
// const multer = require('multer');
// const { json, response } = require('express');


// ----- 確認帳號密碼是否存在
exports.checkExist = async (req, res) => {
    try {
        const requestData = req.body;
        const account = requestData.account;
        const password = requestData.password;
        let responseData = {}

        const account_configCrypto = new ConfigCrypto();
        // 假設 account_configCrypto.config 是一個包含帳號資訊的陣列
        const accounts = account_configCrypto.config;

        // 檢查帳號與密碼是否存在
        let accountExists = accounts.some(acc => acc.account === account && acc.password === password);
        responseData.exists = accountExists;

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(200).send(responseData);
    } catch (error) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(500).send(`[checkExist] Error : ${error.message || error}`);
    }
}
