const { Router } = require('express');
const loginController = require('../controllers/LoginController');

const app = Router();

// - Action. 
// @ CRUD 
app.post('/login/checkExist', loginController.checkExist);
app.get('/login/accountList', loginController.accountList);


module.exports = app;