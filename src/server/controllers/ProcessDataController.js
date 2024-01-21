const ConfigCrypto = require('../tools/ConfigCrypto')
const { OpenAI } = require("openai");

const ExcelJS = require('exceljs');
var Nzh = require("nzh");
var nzhhk = require("nzh/hk");

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

// -------------------------------------------------- 儲存檔案 - 用於確定目錄路徑
function determineDirectories(headers) {
    
    const account = headers['stored-account'];
    let processedDirectory, filesDirectory;

    if (account && account !== 'admin') {
        // 檢查 account 是否存在，並且不是 admin
        processedDirectory = path.join(__dirname, '..', 'uploads', 'processed', account);
        filesDirectory = path.join(__dirname, '..', 'uploads', 'files', account);

        // // 確認資料夾是否存在
        // if (!fs.existsSync(filesDirectory)) { fs.mkdirSync(filesDirectory, { recursive: true }); }
        // if (!fs.existsSync(processedDirectory)) { fs.mkdirSync(processedDirectory, { recursive: true }); }
    } else {
        // 如果 account 不存在或是 admin，則使用預設路徑
        const temp_account =  headers['temp-stored-account']
        processedDirectory = path.join(__dirname, '..', 'uploads', 'processed', temp_account);
        filesDirectory = path.join(__dirname, '..', 'uploads', 'files', temp_account);
    }

    // 確認資料夾是否存在
    if (!fs.existsSync(filesDirectory)) { fs.mkdirSync(filesDirectory, { recursive: true }); }
    if (!fs.existsSync(processedDirectory)) { fs.mkdirSync(processedDirectory, { recursive: true }); }

    return { processedDirectory, filesDirectory };
}

// -------------------------------------------------- 儲存檔案
exports.uploadTheFile = async (req, res) => {
    try {
        const { processedDirectory, filesDirectory } = determineDirectories(req.headers);

        const storage = multer.diskStorage({
            destination: function(req, file, cb) {
                cb(null, filesDirectory);
            },
            filename: function(req, file, cb) {  // 應該是 `filename` 而不是 `fileName`
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

            // 讀取並處理檔案
            const sourceFilePath = req.file.path;
            const destFilePath = path.join(processedDirectory, req.file.originalname);

            // 新增處理 'processed' 欄位的邏輯
            const processedData = [];
            const originalData = []; // 初始化用於儲存不含 `processed` 欄位的數據的陣列
            const fileContent = fs.readFileSync(sourceFilePath, 'utf8');
            const lines = fileContent.split('\n').filter(line => line.trim()); // 加入過濾條件

            lines.forEach(line => {
                let processedEntry = { processed: [] };
                let originalEntry = JSON.parse(line);
            
                if (originalEntry.processed) {
                    processedEntry.processed = originalEntry.processed;
                    delete originalEntry.processed; // 從原始數據中刪除 `processed` 欄位
                }
            
                processedData.push(JSON.stringify(processedEntry));
                originalData.push(JSON.stringify(originalEntry)); // 儲存不含 `processed` 欄位的數據
            });
            

            // 將 `processed` 數據寫入 `processedDirectory`
            const processedFilePath = path.join(processedDirectory, `${req.file.originalname}`);
            fs.writeFileSync(processedFilePath, processedData.join('\n'));

            // 將不含 `processed` 欄位的數據寫入 `filesDirectory`
            const originalFilePath = path.join(filesDirectory, `${req.file.originalname}`);
            fs.writeFileSync(originalFilePath, originalData.join('\n'));

            const responseData = {
                fileName: req.file.originalname,
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

// -------------------------------------------------- 回傳目前資料夾內部的檔案清單
exports.fetchUploadsFileName = async (req, res) => {
    try {

        const { processedDirectory, filesDirectory } = determineDirectories(req.headers);
        const files = fs.readdirSync(filesDirectory);  // = 讀取檔案名稱

        // @ 2. 過濾出 .json 檔案
        const responseData = files.filter(file => path.extname(file) === '.txt');

        res.status(200).send(responseData);
    }
    catch (error) {
        res.status(500).send(`[fetchUploadsFileName] Error : ${error.message || error}`);
    }
}

// -------------------------------------------------- 讀取 processed -> Content
exports.fetchProcessedContent = async (req, res) => {
    try {

        // @ 1. 讀取檔案
        const fileName = req.body.fileName
        
        const { processedDirectory, filesDirectory } = determineDirectories(req.headers);

        // @ 2. 過濾出.txt 檔案且名稱符合 req.body.fileName
        const files = fs.readdirSync(processedDirectory); 
        const targetFile = files.find(file => path.extname(file) === '.txt' && file === fileName);

        // @ 3. 讀取檔案
        if (targetFile) {
            const filePath = path.join(processedDirectory, targetFile);
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const responseData = fileContent.trim().split('\n').map(line => JSON.parse(line));
            res.status(200).send(responseData);
        } 

        else res.status(404).send('File not found.');
    }
    catch (error) {
        res.status(500).send(`[fetchProcessedContent] Error : ${error.message || error}`);
    }
}

// -------------------------------------------------- 讀取 processed -> Content
exports.fetchProcessedContentByUser = async (req, res) => {
    try {
        // @ 1. 讀取檔案
        const fileName = req.body.fileName
        const selectedFormatUser = req.body.selectedFormatUser
        const processedDirectory = path.join(__dirname, '..', 'uploads', 'processed', selectedFormatUser);

        // @ 2. 過濾出.txt 檔案且名稱符合 req.body.fileName
        const files = fs.readdirSync(processedDirectory); 
        const targetFile = files.find(file => path.extname(file) === '.txt' && file === fileName);

        // @ 3. 讀取檔案
        if (targetFile) {
            const filePath = path.join(processedDirectory, targetFile);
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const responseData = fileContent.trim().split('\n').map(line => JSON.parse(line));
            res.status(200).send(responseData);
        } 

        else res.status(404).send('File not found.');
    }
    catch (error) {
        res.status(500).send(`[fetchProcessedContentByUser] Error : ${error.message || error}`);
    }
}


// -------------------------------------------------- 獲得 file -> Content
exports.fetchFileContent = async (req, res) => {
    try {

        // @ 1. 確認變數
        const { processedDirectory, filesDirectory } = determineDirectories(req.headers);

        // @ 2. 過濾出.txt 檔案且名稱符合 req.body.fileName
        const files = fs.readdirSync(filesDirectory); 
        const targetFile = files.find(file => path.extname(file) === '.txt' && file === req.body.fileName);

        // @ 3. 讀取檔案
        if (targetFile) {
            const filePath = path.join(filesDirectory, targetFile);
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const responseData = fileContent.trim().split('\n').map(line => JSON.parse(line)); // Json Lines.

            res.status(200).send(responseData);
        } 
        else {
            res.status(404).send('File not found.');
        }
    }
    catch (error) {
        res.status(500).send(`[fetchFileContent] Error : ${error.message || error}`);
    }
};

// -------------------------------------------------- 儲存已修改的資料
exports.uploadProcessedFile = async (req, res) => {
    try {

        const fileName = req.body.fileName;
        const { processedDirectory, filesDirectory } = determineDirectories(req.headers);

        // @ 轉換格式
        const processData = req.body.processed; 
        const formattedData = processData.map(item => JSON.stringify(item)).join('\n');

        // @ 存擋
        const filePath = path.join(processedDirectory, fileName);
        fs.writeFileSync(filePath, formattedData, 'utf8');

        res.status(200).send("Processed Update Successfully");
    } catch (error) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(500).send(`[uploadProcessedFile] Error : ${error.message || error}`);
    }
}


// -------------------------------------------------- 下載檔案
exports.downloadProcessedFile = async (req, res) => {
    try {

        const { processedDirectory, filesDirectory } = determineDirectories(req.headers);
        const filePath = path.join(filesDirectory, req.body.fileName);
        const processedPath = path.join(processedDirectory, req.body.fileName);

        // 檢查檔案是否存在
        if (fs.existsSync(filePath) && fs.existsSync(processedPath)) {

            const fileLines = fs.readFileSync(filePath, 'utf-8').split('\n').filter(line => line.trim());
            const processedLines = fs.readFileSync(processedPath, 'utf-8').split('\n').filter(line => line.trim());

            
            const mergedData = fileLines.map((line, index) => {
                try {
                    const originalData = JSON.parse(line);
                    const processedData = JSON.parse(processedLines[index]);
                    return { ...originalData, processed: processedData.processed };
                } catch (error) {
                    console.error(`Error parsing JSON on line ${index + 1}: ${error}`);
                    return null;
                }
            }).filter(data => data !== null);

            const downloadFileName = `${now_formatDate()}-${req.body.fileName}`;
            const downloadFilePath = path.join(filesDirectory, downloadFileName);

            const linesToWrite = mergedData.map(data => JSON.stringify(data));
            const fileContent = linesToWrite.join('\n');

            
            res.setHeader('Content-Disposition', `attachment; fileName=${downloadFileName}`);
            res.setHeader('Content-Type', 'application/json');
            res.send(fileContent);
        } 
        
        else res.status(404).send('One or both files not found');
    }
    catch (error) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(500).send(`[downloadProcessedFile] Error : ${error.message || error}`);
    }
}


// -------------------------------------------------- 全體增加欄位
exports.addExtractionLabel_all = async (req, res) => {
    try {

        const { processedDirectory } = determineDirectories(req.headers);

        const labelToAdd = req.body.labelToAdd;
        if (!labelToAdd) res.status(500).send("labelToAdd is empty"); // = 防呆

        const fileName = req.body.fileName;
        if (!fileName) return res.status(400).send("fileName is required"); // = 防呆

        const processedFilePath = path.join(processedDirectory, fileName);
        if (!processedFilePath) res.status(500).send("Can't found processed"); // = 防呆

        // @ 讀取檔案
        const fileContent = fs.readFileSync(processedFilePath, 'utf8');
        const lines = fileContent.split('\n');

        // @ 檢查是否存在重複標籤
        for (const line of lines) {
            let item = JSON.parse(line);
            if (item.processed && item.processed.some(e => e.name === labelToAdd)) {
                return res.status(200).send(`重複欄位 ${labelToAdd}`);
            }
        }

        // @ 轉換格式
        const formattedData = lines.map(line => {
            let item = JSON.parse(line);

            // - 有資料
            if(item.processed) {
                item.processed.push({
                    name: labelToAdd, value: "", the_surrounding_words: "", 
                    regular_expression_match: "", regular_expression_formula: "", 
                    gpt_value: "", 
                    pre_normalize_value: "", 
                    position: {start_position: -1, end_position: -1}
                });
            } 
            
            // - 無資料
            else {
                item.processed = [{
                    name: labelToAdd, value: "", the_surrounding_words: "", 
                    regular_expression_match: "", regular_expression_formula: "", 
                    gpt_value: "", 
                    pre_normalize_value: "", 
                    position: {start_position: -1, end_position: -1}
                }];
            }
            return JSON.stringify(item);
        }).join('\n');

        // @ 存擋
        const savePath = path.join(processedDirectory, fileName);
        fs.writeFileSync(savePath, formattedData, 'utf8');
        res.status(200).send(`${labelToAdd} 加入成功`);

    } catch (error) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(500).send(`[addExtractionLabel_all] Error : ${error.message || error}`);
    }
}

// -------------------------------------------------- 全體減少欄位
exports.removeLabel_all = async (req, res) => {
    try {
        const { processedDirectory } = determineDirectories(req.headers);

        const fileName = req.body.fileName;
        const labelToRemove = req.body.labelToRemove;
        if (!labelToRemove) return res.status(400).send("labelToRemove is empty");
        if (!fileName) return res.status(400).send("fileName is required");

        const processedFilePath = path.join(processedDirectory, fileName);
        if (!fs.existsSync(processedFilePath)) return res.status(400).send("Can't find processed file");

        // 讀取檔案
        const fileContent = fs.readFileSync(processedFilePath, 'utf8');
        const lines = fileContent.split('\n');

        const formattedData = lines.map(line => {
            let item = JSON.parse(line);
            if (item.processed) {
                item.processed = item.processed.filter(label => label.name !== labelToRemove);
            }
            return JSON.stringify(item);
        }).join('\n');

        // 存檔
        fs.writeFileSync(processedFilePath, formattedData, 'utf8');
        res.status(200).send(`${labelToRemove} 刪除成功`);

    } catch (error) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(500).send(`[removeLabel_all] Error : ${error.message || error}`);
    }
}

// -------------------------------------------------- 刪除檔案 - 刪除指定檔案
function deleteFileSafely(filePath) {

    // - 返回一個新的 Promise 對象，Promise 用於異步操作。
    return new Promise((resolve, reject) => {
        if (fs.existsSync(filePath)) {
            
            // - 檢查指定路徑的文件是否存在
            fs.unlink(filePath, (err) => {
                if (err) reject(err);        // = 如果出現錯誤，則拒絕（reject）Promise，並將錯誤傳遞出去
                else resolve();              // = 如果沒有錯誤，則解決（resolve）Promise，表示操作成功完成
            });
        } 
        else resolve(); 
    });
    
}

// -------------------------------------------------- 刪除檔案
exports.deleteFile = async (req, res) => {
    try {

        // @ 1. 確認變數
        const fileName = req.body.fileName;
        const { processedDirectory, filesDirectory } = determineDirectories(req.headers);

        // @ 2. 過濾出.txt 檔案且名稱符合 req.body.fileName
        const files = fs.readdirSync(filesDirectory); 
        const targetFile = files.find(file => path.extname(file) === '.txt' && file === fileName);

        // @ 3. 刪除檔案
        if (targetFile) {
            const filePath = path.join(filesDirectory, targetFile);
            await deleteFileSafely(filePath);

            const processedFilePath = path.join(processedDirectory, targetFile);
            await deleteFileSafely(processedFilePath);
        }

        res.status(200).send(`${fileName} 檔案刪除成功`);
    }
    catch (error) {
        res.status(500).send(`[deleteFile] Error : ${error.message || error}`);
    }
}

// -------------------------------------------------- 儲存排序的資料
exports.uploadFileSort = async (req, res) => {
    try {
        const { processedDirectory } = determineDirectories(req.headers);
        const sortOptions = req.body.sortOptions;
        const fileName = req.body.fileName;

        const processedFilePath = path.join(processedDirectory, fileName);
        if (!fs.existsSync(processedFilePath)) return res.status(400).send("Can't find processed file");

        // 讀取檔案
        const processedContent = fs.readFileSync(processedFilePath, 'utf8');
        let processed = processedContent.split('\n').map(line => {
            try {
                return JSON.parse(line);
            } catch (e) {
                console.error(`JSON parsing error in line: ${line}`);
                return null;
            }
        });

        // 過濾掉無效的行
        processed = processed.filter(item => item !== null);
        processed.forEach(data => {
            if (data.processed && Array.isArray(data.processed)) {
                data.processed = sortOptions.map(itemName => 
                    data.processed.find(item => item.name === itemName))
                    .filter(item => item !== undefined);
            }
        });

        const formattedData = processed.map(item => JSON.stringify(item)).join('\n');

        // 存擋
        fs.writeFileSync(processedFilePath, formattedData, 'utf8');

        res.status(200).send("排序成功");
    } catch (error) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(500).send(`[uploadFileSort] Error : ${error.message || error}`);
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
        res.status(500).send(`[test_GPT] Error : ${error.message || error}`);
    }
}

exports.gptRetrieve = async (req, res) => {
    try {
        // - Data Preparation
        const requestData = req.body;
        var responseData = {};
        if (Array.isArray(requestData.processedFields)) {
            responseData.processedFields = requestData.processedFields.map(item => {
                return {
                    name: item.name,
                    gpt_value: item.gpt_value
                }
            })
        } else {
            throw new Error('processedFields must be an array');
        }

        // - GPT Question
        const system_content = "你現在是資料擷取專家，你需要按照此JSON 格式的 name 擷取填入對應的 gpt_value。只需要回傳 JSON 。注意！原本的結構不可以變更， \n \n"     

        // - 1. text, 把大量文本拆成 2048 以下的 token 數量，成為 List
        const originalText = requestData.currentFileContentVisual;

        var textList = splitText(originalText, input_token = 2048, now_token = (JSON.stringify(responseData.processedFields).length + system_content.length));

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
                    "content": system_content + JSON.stringify(responseData.processedFields) 
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
                responseData.processedFields = parsedJson;
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

        let countItem = 0;
        const totalCountItem = requestContent.length;
        for (const contentItem of requestContent) {
            console.log(`GPT Action ALL... count: ${countItem}, totalCountItem: ${totalCountItem}`);

            const originalText = contentItem[contentKey];
            var processedContent = []

            if (Array.isArray(contentItem.processed)) {
                processedContent = contentItem.processed.map(item => {
                    return {
                        name: item.name,
                        gpt_value: item.gpt_value
                    }
                })
            } else {
                throw new Error('processedFields must be an array');
            }

            var textList = splitText(originalText, input_token = 2048, now_token = (JSON.stringify(processedContent).length + system_content.length));
            var contentItemProcessed_temp = {}

            for (const [index, text] of textList.entries()) {
                console.log(`Split Text Entries, Total Length: ${textList.length}, Now Count: ${index}`);
                const messageList = [
                    { 
                        "role": "system", 
                        "content": system_content + JSON.stringify(processedContent) 
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

            countItem += 1;
            responseData.push(contentItemProcessed_temp);
        }

        res.status(200).send(responseData);
    } catch (error) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(500).send(`[gptRetrieve_all] Error : ${error.message || error}`);
    }
};


function splitText(text, input_token=2048, now_token = 0) {
    console.log(`Split Text, input token: ${input_token}, now token: ${now_token}`)

    if (now_token > input_token) return text;

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

function is_number(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

exports.formatterProcessedContent = async (req, res) => {
    try {

        /**
         * fileName
         * preFormatterLabel
         * preFormatterMethod
         */

        // - Data Preparation
        const fileName = req.body.fileName;
        const selectedFormatUser = req.body.selectedFormatUser;
        const preFormatterLabel = req.body.preFormatterLabel;
        const preFormatterMethod = req.body.preFormatterMethod;

        if (preFormatterMethod == 'number') {
            var responseData = [];

            // @ 1. 讀取資料 ../uploads/processed
            const processedDirectory = path.join(__dirname, '..', 'uploads', 'processed', selectedFormatUser);
            const files = fs.readdirSync(processedDirectory);

            // @ 2. 過濾出.txt 檔案且名稱符合 req.body.fileName
            const targetFile = files.find(file => path.extname(file) === '.txt' && file === fileName);
            function replaceChineseNumbers(input) {
                const mapping = {
                    '零': '零', '壹': '一', '貳': '二', '參': '三', '肆': '四', 
                    '伍': '五', '陸': '六', '柒': '七', '捌': '八', '玖': '九', 
                    '拾': '十', '0': '零', '1': '一', '2': '二', '3': '三', 
                    '4': '四', '5': '五', '6': '六', '7': '七', '8': '八', '9': '九'
                };
                let output = '';
                for (let char of input) {
                    output += mapping[char] || char;
                }
                return output;
            }

            function convertToChineseNumber(input) {
                const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
                const units = ['', '十', '百', '千'];
                let output = input.replace(/\d+/g, (num) => {
                if (num === '10') return '十';
                let chineseNumber = '';
                let reverseDigits = [...num].reverse();

                reverseDigits.forEach((digit, index) => {
                    if (digit !== '0') {
                        chineseNumber = digits[digit] + units[index] + chineseNumber;
                    } else if (!chineseNumber.startsWith('零')) {
                        chineseNumber = '零' + chineseNumber;
                    }
                });
                    return chineseNumber.replace(/^一十/, '十').replace(/零+$/, '');
                });
                return output;
            }

            function translateV2(numberString) {
                const step1 = numberString.replace(/,|元/g, '');
                if (/^\d+$/.test(step1)) {
                    return Number(step1);
                } else {
                    const step2 = convertToChineseNumber(step1)
                    const step3 = replaceChineseNumbers(step2);
                    return Number(nzhhk.decodeS(step3));
                }
                
            }

            // @ 3. 讀取檔案
            if (targetFile) {
                const filePath = path.join(processedDirectory, targetFile);
                const fileContent = fs.readFileSync(filePath, 'utf8');
                const jsonLines = fileContent.trim().split('\n').map(line => JSON.parse(line));

                jsonLines.forEach(jsonLine => {
                    jsonLine.processed.forEach(item => {
                        if (item.name == preFormatterLabel) {
                            item.pre_normalize_value = item.value
                            item.value = translateV2(item.value);
                        }
                    });
                    responseData.push(JSON.stringify(jsonLine));
                });

                // 將更新後的內容寫回原始檔案
                fs.writeFileSync(filePath, responseData.join('\n'));
            } else {
                res.status(404).send('File not found.');
            }

            res.status(200).send(responseData);
        } else if (preFormatterMethod == 'ROC') {
            var responseData = [];
            // TODO: 轉換日期
            const extractDate = (str) => {
                const regex = /(\d{2,4})年(\d{1,2})月(\d{1,2})?日?/;
                const match = str.match(regex);
            
                if (match) {
                    let year = parseInt(match[1]);
                    const month = match[2];
                    const day = match[3] ? match[3] : '15';
            
                    // 如果年份大於 1911，則從年份中減去 1911
                    if (year > 1911) {
                        year -= 1911;
                    }
            
                    return `${year}年${month}月${day}日`;
                } else {
                    return null;
                }
            };

            const extractText = (str) => {
                str = str.replace(/\([^)]*\)/g, '').replace(/\（[^)]*\）/g, '');
                const regex = /\S+/g;
                const matches = str.match(regex);
            
                // 直接連接匹配到的字串，不使用空格分隔
                return matches ? matches.join('') : '';
            };

            // @ 1. 讀取資料 ../uploads/processed
            const processedDirectory = path.join(__dirname, '..', 'uploads', 'processed', selectedFormatUser);
            const files = fs.readdirSync(processedDirectory);

            // @ 2. 過濾出.txt 檔案且名稱符合 req.body.fileName
            const targetFile = files.find(file => path.extname(file) === '.txt' && file === fileName);
            // @ 3. 讀取檔案
            if (targetFile) {
                const filePath = path.join(processedDirectory, targetFile);
                const fileContent = fs.readFileSync(filePath, 'utf8');
                const jsonLines = fileContent.trim().split('\n').map(line => JSON.parse(line));

                jsonLines.forEach(jsonLine => {
                    jsonLine.processed.forEach(item => {
                        if (item.name == preFormatterLabel) {
                            item.pre_normalize_value = item.value
                            const formatDate = extractDate(extractText(item.value));
                            console.log(formatDate);
                            if (formatDate) {
                                item.value = formatDate;
                            } else {
                                item.value = "";
                            }
                        }
                    });
                    
                    responseData.push(JSON.stringify(jsonLine));
                });

                // 將更新後的內容寫回原始檔案
                fs.writeFileSync(filePath, responseData.join('\n'));
            } else {
                res.status(404).send('File not found.');
            }
            res.status(200).send(responseData);
        }
    } catch (error) {
        console.log(error);
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(500).send(`[formatterProcessedContent] Error : ${error.message || error}`);
    }
};

// -------------------------------------------------- 下載CSV
exports.downloadExcel = async (req, res) => {
    try {
        const selectedUsers = req.body.selectedUsers;
        const fileName = req.body.fileName;

        // 創建一個新的 Excel 工作簿
        const workbook = new ExcelJS.Workbook();

        for (let selectedUser of selectedUsers) {
            const processedDirectory = path.join(__dirname, '..', 'uploads', 'processed', selectedUser, fileName);
            const filesDirectory = path.join(__dirname, '..', 'uploads', 'files', selectedUser, fileName);
            if (fs.existsSync(processedDirectory) && fs.existsSync(filesDirectory)) {
                const fileLines = fs.readFileSync(filesDirectory, 'utf-8').split('\n').filter(line => line.trim());
                const processedLines = fs.readFileSync(processedDirectory, 'utf-8').split('\n').filter(line => line.trim());

                // 添加一個新的工作表
                const sheet = workbook.addWorksheet(selectedUser);
        
                // 添加標題行
                const processed = JSON.parse(processedLines[0]);
                sheet.columns = processed.processed.map(item => ({ header: item.name, key: item.name }));
        
                // 添加數據行
                fileLines.forEach((line, index) => {
                    try {
                        const originalData = JSON.parse(line);
                        const processedData = JSON.parse(processedLines[index]);
                        processedData.processed.forEach(item => {
                            originalData[item.name] = item.value;
                        });
                        sheet.addRow(originalData);
                    } catch (error) {
                        console.error(`Error parsing JSON on line ${index + 1}: ${error}`);
                    }
                });
            } else {
                res.status(404).send('One or both files not found');
            }
        }
        // 寫入 Excel 文件
        const excelFileName = `${now_formatDate()}-${req.body.fileName}.xlsx`.replace('.txt', '');
        const excelFilePath = path.join(excelFileName);
        await workbook.xlsx.writeFile(excelFileName);

        // 讀取 Excel 文件內容
        const excelContent = fs.readFileSync(excelFilePath);
    
        // 設置 HTTP 響應頭部
        res.setHeader('Content-Disposition', `attachment; filename=${excelFileName}`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        // 發送文件內容
        res.send(excelContent);

        // 刪除伺服器上的 Excel 檔案
        fs.unlink(excelFileName, (err) => {
            if (err) {
                console.error(`Error deleting Excel file: ${err}`);
            } else {
                console.log(`Excel file ${excelFileName} was deleted.`);
            }
        });
    } catch (error) {
        console.log(error);
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(500).send(`[downloadExcel] Error : ${error.message || error}`);
    }
}

// -------------------------------------------------- compareData -> 抓取 fetchFilesName 後擁有該檔名的所有user
exports.fetchUsers = async (req, res) => {
    try {
        const fileName = req.body.fileName;

        const filesPath = './src/server/uploads/files';
        const files = fs.readdirSync(filesPath);

        const result = [];
        const subfolders = fs.readdirSync(filesPath, { withFileTypes: true })
                                .filter(dirent => dirent.isDirectory())
                                .map(dirent => dirent.name);

        for (const subfolder of subfolders) {
            const subfolderPath = path.join(filesPath, subfolder);
            const filesInSubfolder = fs.readdirSync(subfolderPath);

            if (filesInSubfolder.includes(fileName)) {
                result.push({label: subfolder, value: subfolder});
            }
        }

        res.status(200).send(result);
    }
    catch (error) {
        res.status(500).send(`[fetchUsers] Error : ${error.message || error}`);
    }
}


// -------------------------------------------------- 比對者的 Processed
exports.fetchComparatorProcessedContent = async (req, res) => {
    try {

        // @ 1. 讀取檔案
        const fileName = req.body.fileName
        const fake_headers = {
            "stored-account": req.body.comparator_userName
        }
        
        const { processedDirectory, filesDirectory } = determineDirectories(fake_headers);

        // @ 2. 過濾出.txt 檔案且名稱符合 req.body.fileName
        const files = fs.readdirSync(processedDirectory); 
        const targetFile = files.find(file => path.extname(file) === '.txt' && file === fileName);

        // @ 3. 讀取檔案
        if (targetFile) {
            const filePath = path.join(processedDirectory, targetFile);
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const responseData = fileContent.trim().split('\n').map(line => JSON.parse(line));
            res.status(200).send(responseData);
        } 

        else res.status(404).send('File not found.');
    }
    catch (error) {
        res.status(500).send(`[fetchProcessedContent] Error : ${error.message || error}`);
    }
}