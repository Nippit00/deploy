
const express = require('express');


const authController = require('../controllers/auth');
const isLoggedIn = require('../middlewares/is-login')

const router = express.Router();

router.get('/login', isLoggedIn, (req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // HTTP 1.1
    res.setHeader('Pragma', 'no-cache'); // HTTP 1.0
    res.setHeader('Expires', '0'); // Proxies
    authController.getLogin(req, res, next);
});
router.post('/logout', authController.postLogout);
router.post('/login', authController.PostLogin);

module.exports = router;