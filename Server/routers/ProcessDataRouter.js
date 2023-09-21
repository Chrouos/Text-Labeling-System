const { Router } = require('express');
const processDataController = require('../controllers/ProcessDataController')

const app = Router();

// - Action. 
app.post('/processData/uploadTheFile', processDataController.uploadTheFile);

module.exports = app;