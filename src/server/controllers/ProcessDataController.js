const ConfigCrypto = require('../tools/ConfigCrypto')
const { OpenAI } = require("openai");

const fs = require('fs')
const path = require('path')
const multer = require('multer');
const { json, response } = require('express');

function now_formatDate() {
    const date = new Date();
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0'); // January is 0!
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0'); // 24-hour format
    const mi = String(date.getMinutes()).padStart(2, '0'); // Minutes
    return yyyy + mm + dd + hh + mi;
}

// -------------------- 儲存檔案
exports.uploadTheFile = async (req, res) => {
    try {
        const targetDirectory = path.join(__dirname, '..', 'uploads', 'files');
        const processedDirectory = path.join(__dirname, '..', 'uploads', 'processed');

        // 確認資料夾是否存在
        if (!fs.existsSync(targetDirectory)) { fs.mkdirSync(targetDirectory, { recursive: true }); }
        if (!fs.existsSync(processedDirectory)) { fs.mkdirSync(processedDirectory, { recursive: true }); }

        const storage = multer.diskStorage({
            destination: function(req, file, cb) {
                cb(null, targetDirectory);
            },
            filename: function(req, file, cb) {
                cb(null, file.originalname);
            }
        });

        const upload = multer({ storage: storage }).single('file');

        upload(req, res, async function(err) {
            if (err) {
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.status(500).send(`[uploadTheFile] Multer error: ${err.message || err}`);
                return;
            }

            const sourceFilePath = req.file.path;
            const destFilePath = path.join(processedDirectory, req.file.filename);
            fs.copyFileSync(sourceFilePath, destFilePath);

            const responseData = {
                fileName: req.file.filename,
                originalName: req.file.originalname,
                path: req.file.path,
                size: req.file.size
            };

            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.status(200).send(responseData);
        });
    } catch (error) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(500).send(`[uploadTheFile] Error : ${error.message || error}`);
    }
}



// -------------------- 回傳目前資料夾內部的檔案清單
exports.fetchUploadsFileName = async (req, res) => {
    try {

        // @ 1. 讀取資料 ../uploads
        const targetDirectory = path.join(__dirname, '..', 'uploads', 'files');
        const files = fs.readdirSync(targetDirectory); 

        // @ 2. 過濾出 .json 檔案
        const jsonFiles = files.filter(file => path.extname(file) === '.txt');

        res.status(200).send(jsonFiles);
    }
    catch (error) {
        res.status(500).send(`[uploadTheFile] Error : ${error.message || error}`);
    }
}

exports.fetchUploadsProcessedFileName = async (req, res) => {
    try {

        // @ 1. 讀取資料 ../uploads/processed
        const processedDirectory = path.join(__dirname, '..', 'uploads', 'processed');
        const files = fs.readdirSync(processedDirectory); 

        // @ 2. 過濾出.txt 檔案且名稱符合 req.body.fileName
        const targetFile = files.find(file => path.extname(file) === '.txt' && file === req.body.fileName);

        // @ 3. 讀取檔案
        if (targetFile) {
            const filePath = path.join(processedDirectory, targetFile);
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const jsonLines = fileContent.trim().split('\n').map(line => JSON.parse(line));

            res.status(200).send(jsonLines);
        } else {
            res.status(404).send('File not found.');
        }
    }
    catch (error) {
        res.status(500).send(`[uploadTheFile] Error : ${error.message || error}`);
    }
}

// -------------------- 刪除檔案
exports.deleteFile = async (req, res) => {
    try {

        // @ 1. check the file name exists.
        const targetDirectory = path.join(__dirname, '..', 'uploads', 'files');
        const processedDirectory = path.join(__dirname, '..', 'uploads', 'processed');
        const files = fs.readdirSync(targetDirectory); 

        // @ 2. 過濾出.txt 檔案且名稱符合 req.body.fileName
        const targetFile = files.find(file => path.extname(file) === '.txt' && file === req.body.fileName);

        // @ 3. 刪除檔案
        if (targetFile) {
            const filePath = path.join(targetDirectory, targetFile);
            fs.unlinkSync(filePath);

            // @ 4. 同步刪除 processedDirectory 中的檔案
            const processedFilePath = path.join(processedDirectory, targetFile);
            if (fs.existsSync(processedFilePath)) {
                fs.unlinkSync(processedFilePath);
            }
        }

        res.status(200).send(targetFile);
    }
    catch (error) {
        res.status(500).send(`[deleteFile] Error : ${error.message || error}`);
    }
}



exports.fetchFileContentJson = async (req, res) => {

    try {

        // @ 1. check the file name exists.
        const targetDirectory = path.join(__dirname, '..', 'uploads', 'files');
        const files = fs.readdirSync(targetDirectory); 

        // @ 2. 過濾出.txt 檔案且名稱符合 req.body.fileName
        const targetFile = files.find(file => path.extname(file) === '.txt' && file === req.body.fileName);

        // @ 3. 讀取檔案
        if (targetFile) {
            const filePath = path.join(targetDirectory, targetFile);
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const jsonLines = fileContent.trim().split('\n').map(line => JSON.parse(line));

            res.status(200).send(jsonLines);
        } else {
            res.status(404).send('File not found.');
        }

    }
    catch (error) {
        res.status(500).send(`[fetchFileContentJson] Error : ${error.message || error}`);
    }

};


// - 儲存已修改的資料
exports.uploadProcessedFile = async (req, res) => {
    try {
        const processedDirectory = path.join(__dirname, '..', 'uploads', 'processed');

        // @ 確認檔案存在
        if (!fs.existsSync(processedDirectory)) { 
            fs.mkdirSync(processedDirectory, { recursive: true }); 
        }

        // @ 轉換格式
        const contentData = req.body.content; 
        const formattedData = contentData.map(item => JSON.stringify(item)).join('\n');
        

        // @ 存擋
        const filePath = path.join(processedDirectory, req.body.fileName);
        fs.writeFileSync(filePath, formattedData, 'utf8');

        res.status(200).send(req.body);
    } catch (error) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(500).send(`[uploadProcessedFile] Error : ${error.message || error}`);
    }
}


// - 下載檔案
exports.downloadProcessedFile = async (req, res) => {
    try {
        const targetDirectory = path.join(__dirname, '..', 'uploads', 'processed');
        const filePath = path.join(targetDirectory, req.body.fileName);

        // 檢查檔案是否存在
        if (fs.existsSync(filePath)) {
            const downloadFileName = `${now_formatDate()}-${req.body.fileName}`;

            res.setHeader('Content-Disposition', `attachment; filename=${downloadFileName}`);
            res.download(filePath, downloadFileName);
        } else {
            res.status(404).send('File not found');
        }
    }
    catch (error) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(500).send(`[downloadProcessedFile] Error : ${error.message || error}`);
    }
}


// - 全體增加欄位
exports.addNewLabel_all = async (req, res) => {
    try {
        const processedDirectory = path.join(__dirname, '..', 'uploads', 'processed');

        // @ 確認檔案存在
        if (!fs.existsSync(processedDirectory)) { 
            fs.mkdirSync(processedDirectory, { recursive: true }); 
        }

        // @ 轉換格式
        const contentData = req.body.content; 
        const newLabel = req.body.newLabel || ""; // 從 req.body 獲取 newLabel，如果不存在，則設為空字符串

        const formattedData = contentData.map(item => {
            // 如果 item 中有 processed 屬性，則在 processed 中加入 newLabel
            if(item.processed) {
                item.processed.push({name: newLabel, value: "", the_surrounding_words: "", regular_expression_match: "", regular_expression_formula: "", gpt_value: ""});
            } else {
                // 如果 item 中沒有 processed 屬性，則創建一個並加入 newLabel
                item.processed = [];
                item.processed.push({name: newLabel, value: "", the_surrounding_words: "", regular_expression_match: "", regular_expression_formula: "", gpt_value: ""});
            }
            return JSON.stringify(item);
        }).join('\n');
        

        // @ 存擋
        const filePath = path.join(processedDirectory, req.body.fileName);
        fs.writeFileSync(filePath, formattedData, 'utf8');

        res.status(200).send(req.body);
    } catch (error) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(500).send(`[addNewLabel_all] Error : ${error.message || error}`);
    }
}

exports.removeLabel_all = async (req, res) => {
    try {
        const processedDirectory = path.join(__dirname, '..', 'uploads', 'processed');

        // @ 確認檔案存在
        if (!fs.existsSync(processedDirectory)) {
            fs.mkdirSync(processedDirectory, { recursive: true });
        }

        // @ 轉換格式
        const contentData = req.body.content;
        const labelToRemove = req.body.labelToRemove; // 從 req.body 獲取 labelToRemove

        if (!labelToRemove) {
            throw new Error("labelToRemove not provided");
        }

        const formattedData = contentData.map(item => {
            if (item.processed) {
                // 使用 filter 函數過濾掉要刪除的標籤
                item.processed = item.processed.filter(label => label.name !== labelToRemove);
            }
            return JSON.stringify(item);
        }).join('\n');

        // @ 存擋
        const filePath = path.join(processedDirectory, req.body.fileName);
        fs.writeFileSync(filePath, formattedData, 'utf8');

        res.status(200).send(req.body);
    } catch (error) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(500).send(`[removeLabel_all] Error : ${error.message || error}`);
    }
}


exports.test_GPT = async (req, res) => {
    try {

        const requestData = req.body; // Data from the request.
        const messageList = [{
            "role": "user",
            "content": requestData.content
        }]

        // - 獲得 OpenAI API
        const configCrypto = new ConfigCrypto();
        const OPENAI_API_KEY = configCrypto.config.GPT_KEY; // Get OpenAI API key
        const openai = new OpenAI({
            apiKey: OPENAI_API_KEY // This is also the default, can be omitted
          });

        // ! 產生可能會需要一點時間
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: messageList,
            temperature: 0.1,
            max_tokens: 1024,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0
        });
        
        res.status(500).send(response.choices[0].message);
    } catch (error) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(500).send(`[gptRetrieve] Error : ${error.message || error}`);
    }
}

exports.gptRetrieve = async (req, res) => {
    try {
        // - Data Preparation
        const requestData = req.body;
        var responseData = {};
        responseData.labelFields = requestData.labelFields.map(item => {
            return {
                name: item.name,
                gpt_value: item.gpt_value
            }
        })

        // - GPT Question
        const system_content = "你現在是資料擷取專家，你需要按照此JSON 格式的 name 擷取填入對應的 gpt_value。只需要回傳 JSON 。注意！原本的結構不可以變更， \n \n"     

        // - 1. text, 把大量文本拆成 2048 以下的 token 數量，成為 List
        const originalText = req.body.content;
        var textList = splitText(originalText, input_token = 2048, now_token = (JSON.stringify(responseData.labelFields).length + system_content.length));

        // - 2. 將 text List 送給 GPT做批量 retrieve
        const configCrypto = new ConfigCrypto();
        const OPENAI_API_KEY = configCrypto.config.GPT_KEY; // Get OpenAI API key
        const openai = new OpenAI({
            apiKey: OPENAI_API_KEY // This is also the default, can be omitted
        });

        for (const [index, text] of textList.entries()) {
            const messageList = [
                { 
                    "role": "system", 
                    "content": system_content + JSON.stringify(responseData.labelFields) 
                },
                {
                    "role": "user",
                    "content": JSON.stringify(text)
                }
            ];

            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: messageList,
                temperature: 0.1,
                max_tokens: 1024,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0
            });
            
            try {
                let parsedJson = JSON.parse(response.choices[0].message.content);
                responseData.labelFields = parsedJson;
            } catch (e) {
                console.log("The GPT response is not the Json", response.choices[0].message.content) 
            }
        }

        res.status(200).send(responseData);
    } catch (error) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(500).send(`[gptRetrieve] Error : ${error.message || error}`);
    }
};


exports.gptRetrieve_all = async (req, res) => {
    try {
        // - Data Preparation
        const requestContent = req.body.content;
        const contentKey = req.body.contentKey;
        var responseData = [];

        const configCrypto = new ConfigCrypto();
        const OPENAI_API_KEY = configCrypto.config.GPT_KEY; // Get OpenAI API key
        const openai = new OpenAI({
            apiKey: OPENAI_API_KEY // This is also the default, can be omitted
        });

        // - GPT Question 
        const system_content = "你現在是資料擷取專家，你需要按照此JSON 格式的 name 擷取填入對應的 gpt_value。只需要回傳 JSON 。結構不可以變更，參考: \n"     

        for (const contentItem of requestContent) {
            const originalText = contentItem[contentKey];
            var textList = splitText(originalText, input_token = 2048, now_token = (JSON.stringify(responseData.labelFields).length + system_content.length));

            // @ 只需要留 name, gpt_value
            var contentItemProcessed_temp = contentItem.processed.map(function (item) {
                return {
                    name: item.name,
                    gpt_value: item.gpt_value
                }
            })

            for (const [index, text] of textList.entries()) {
                const messageList = [
                    { 
                        "role": "system", 
                        "content": system_content + JSON.stringify(contentItemProcessed_temp) 
                    },
                    {
                        "role": "user",
                        "content": JSON.stringify(text)
                    }
                ];

                const response = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    messages: messageList,
                    temperature: 0.1,
                    max_tokens: 1024,
                    top_p: 1,
                    frequency_penalty: 0,
                    presence_penalty: 0
                });
                
                try {
                    let parsedJson = JSON.parse(response.choices[0].message.content);
                    contentItemProcessed_temp = parsedJson;
                } catch (e) {
                    console.log("The GPT response is not the Json", response.choices[0].message) 
                }
            }
            responseData.push(contentItemProcessed_temp);
        }

        res.status(200).send(responseData);
    } catch (error) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(500).send(`[gptRetrieve] Error : ${error.message || error}`);
    }
};



function splitText(text, input_token=2048, now_token = 0) {

    const maxTokens = input_token - now_token; // = 希望不要超過的 token 數量
    const punctuation = ['。', '！', '？', '.', '!', '?', '，', '、']; // = 斷點的標點符號

    var textList_result = [];
    var startIdx = 0, endIdx = maxTokens;


    // - 走完 全部的text
    while ( startIdx < text.length ){

        // @ 如果最後的節點超過了則，返回最後的節點
        if (endIdx >= text.length) {
            endIdx = text.length;
        }

        // @ 若沒有超過最後的節點，則繼續
        else {
            
            // @ 尋找最靠近 maxToken 的 標點符號(punctuation)，來分割
            while ( !punctuation.includes(text[endIdx]) && endIdx > startIdx ) { 
                endIdx--;
            }

            // @ startIdx, endIdx -> ...2048... (punctuation) 
            if (endIdx === startIdx) endIdx = startIdx + maxTokens; // = 若找不到就取最長
            else endIdx++ ; // = 標點符號也納進來了 

        }

        // @ 擷取完的資料送進去 console.log(startIdx, endIdx)
        textList_result.push(text.slice(startIdx, endIdx));
        startIdx = endIdx;
        endIdx = startIdx + maxTokens;
    }

    return textList_result;
}



exports.formatterProcessedContent = async (req, res) => {
    try {
        // - Data Preparation
        const requestContent = req.body;
        var responseData = [];


        res.status(200).send(responseData);
    } catch (error) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(500).send(`[gptRetrieve] Error : ${error.message || error}`);
    }
};