const { Router } = require('express');
const processDataController = require('../controllers/ProcessDataController')

const app = Router();

// - Action. 
app.post('/processData/uploadTheFile', processDataController.uploadTheFile);
app.get('/processData/fetchUploadsFileName', processDataController.fetchUploadsFileName);
app.post('/processData/deleteFile', processDataController.deleteFile);
app.post('/processData/fetchFileContentJson', processDataController.fetchFileContentJson);


module.exports = app;