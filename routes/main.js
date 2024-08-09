const express = require('express');
const isLoggedIn = require('../middlewares/is-login')

const mainController = require('../controllers/main');

const router = express.Router();

// **************************
// ***    Welcome Page    ***
// **************************
router.get('/welcome', mainController.getWelcomePage);

// **************************
// ***     Main Page      ***
// **************************
router.get('/', isLoggedIn,mainController.getMainPage);
module.exports = router;
