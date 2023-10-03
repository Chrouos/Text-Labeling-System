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
app.post('/processData/addNewLabel_all', processDataController.addNewLabel_all);
app.post('/processData/removeLabel_all', processDataController.removeLabel_all);
app.post('/processData/gptRetrieve', processDataController.gptRetrieve);




module.exports = app;