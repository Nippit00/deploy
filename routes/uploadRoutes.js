const express = require('express');

const uploadController = require('../controllers/uploadRoutes.js');

const isAuth = require('../middlewares/is-auth.js');
const router = express.Router();

router.post('/formsmart/:solutionID',isAuth, uploadController.uploadFile, uploadController.handleUpload);

// fileExcel cdp2,3
router.post('/formsmart/cdp/:solutionID',isAuth, uploadController.uploadFileCdp2);


//report 2 year
router.post('/report/:cityid',isAuth, uploadController.uploadReport, uploadController.handleUploadReport);


module.exports = router;