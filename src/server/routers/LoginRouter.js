const { Router } = require('express');
const loginController = require('../controllers/LoginController');

const app = Router();

// - Action. 
// @ CRUD 
app.post('/login/checkExist', loginController.checkExist);

module.exports = app;