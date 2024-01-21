const { Router } = require('express');
const processDataController = require('../controllers/ProcessDataController')

const app = Router();

// - Action. 
// @ CRUD 
app.get('/processData/fetchUploadsFileName', processDataController.fetchUploadsFileName);
app.post('/processData/fetchFileContent', processDataController.fetchFileContent);
app.post('/processData/fetchProcessedContent', processDataController.fetchProcessedContent);
app.post('/processData/fetchComparatorProcessedContent', processDataController.fetchComparatorProcessedContent);


app.post('/processData/fetchProcessedContentByUser', processDataController.fetchProcessedContentByUser);
app.post('/processData/deleteFile', processDataController.deleteFile);
app.post('/processData/fetchUsers', processDataController.fetchUsers);

app.post('/processData/uploadTheFile', processDataController.uploadTheFile);
app.post('/processData/uploadProcessedFile', processDataController.uploadProcessedFile);
app.post('/processData/downloadProcessedFile', processDataController.downloadProcessedFile);
app.post('/processData/downloadExcel', processDataController.downloadExcel);

// @ FOR LABEL ACTIONs
app.post('/processData/addExtractionLabel_all', processDataController.addExtractionLabel_all);
app.post('/processData/removeLabel_all', processDataController.removeLabel_all);

// @ FOR GPT ACTIONs
app.post('/processData/gptRetrieve', processDataController.gptRetrieve);
app.post('/processData/gptRetrieve_all', processDataController.gptRetrieve_all);

// @ FOR TRANSFORM
app.post('/processData/formatterProcessedContent', processDataController.formatterProcessedContent);

// @ FOR SORT
app.post('/processData/uploadFileSort', processDataController.uploadFileSort);



module.exports = app;