
const express = require('express');

const noti = require('../controllers/notification.js');


const router = express.Router();

router.get('/noti',noti.notification);

module.exports = router;
