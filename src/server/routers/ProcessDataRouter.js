const { Router } = require('express');
const processDataController = require('../controllers/ProcessDataController')

const app = Router();

// - Action. 
app.post('/processData/uploadTheFile', processDataController.uploadTheFile);
app.get('/processData/fetchUploadsFileName', processDataController.fetchUploadsFileName);
app.post('/processData/deleteFile', processDataController.deleteFile);
app.post('/processData/fetchFileContentJson', processDataController.fetchFileContentJson);
app.post('/processData/uploadProcessedFile', processDataController.uploadProcessedFile);
app.post('/processData/fetchUploadsProcessedFileName', processDataController.fetchUploadsProcessedFileName);
app.post('/processData/downloadProcessedFile', processDataController.downloadProcessedFile);


module.exports = app;