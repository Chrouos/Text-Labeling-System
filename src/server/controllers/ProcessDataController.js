const ConfigCrypto = require('../tools/ConfigCrypto')
const fs = require('fs')
const path = require('path')
const multer = require('multer');

function formatDate(date) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0'); // January is 0!
    const yyyy = date.getFullYear();
    return yyyy + mm + dd;
}

// -------------------- 儲存檔案
exports.uploadTheFile = async (req, res) => {
    try {
        
        const targetDirectory = path.join(__dirname, '..', 'uploads', 'files');

        // - 確認資料夾是否存在
        if (!fs.existsSync(targetDirectory)) {  fs.mkdirSync(targetDirectory, { recursive: true }); }
        
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
        const uploadsDirectory = path.join(__dirname, '..', 'uploads');
        const targetDirectory = path.join(uploadsDirectory, 'files');
        const files = fs.readdirSync(targetDirectory); 

        // @ 2. 過濾出 .json 檔案
        const jsonFiles = files.filter(file => path.extname(file) === '.txt');

        res.status(200).send(jsonFiles);
    }
    catch (error) {
        res.status(500).send(`[uploadTheFile] Error : ${error.message || error}`);
    }
}

// --------------------
exports.deleteFile = async (req, res) => {
    try {

        // @ 1. check the file name exists.
        const targetDirectory = path.join(__dirname, '..', 'uploads', 'files');
        const files = fs.readdirSync(targetDirectory); 

        // @ 2. 過濾出.txt 檔案且名稱符合 req.body.fileName
        const targetFile = files.find(file => path.extname(file) === '.txt' && file === req.body.fileName);

        // @ 3. 刪除檔案
        if (targetFile) {
            const filePath = path.join(targetDirectory, targetFile);
            fs.unlinkSync(filePath);
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
            console.log(targetFile);
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

        res.status(200).send(req.body);
    } catch (error) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(500).send(`[uploadProcessedFile] Error : ${error.message || error}`);
    }
}