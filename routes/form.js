const express = require('express');

const formController = require('../controllers/form.js');
const ad_form=require('../controllers/ad-form.js')
const isAuth = require('../middlewares/is-auth.js');
const isAdmin = require('../middlewares/is-admin')
const isTime = require('../middlewares/is-time');
const router = express.Router();
//user zone
router.post('/comfirmformcheck/:solutionID/:round',isAuth,formController.comfirmFormcheck);
router.get('/formsmart/:solutionID/:round',isAuth,isTime,formController.getformSmart);
router.post('/formcheck/:solutionID/:round',isAuth,formController.postFormcheck);
// //formcdp
router.get('/formcdp1/:solutionID/:round',isAuth,formController.getformCdp1);
//saveform
router.post('/saveForm/:solutionID/:round',isAuth,formController.saveAnsObj);
router.post('/saveEdit/:solutionID/:round',isAuth,formController.saveAnsObjEdit);
router.post('/saveFormcdp1/:solutionID/:round',isAuth,formController.saveAnsObjcdp1);

//Admin Zone
router.get('/ad_formsmart/:solutionID',isAdmin,ad_form.getformSmart);
router.get('/ad_formcdp1/:solutionID',isAdmin,ad_form.getformCdp1);
router.post('/ad_saveForm/:solutionID/:round',isAdmin,ad_form.saveAnsObj);
router.post('/Approve/:solutionID/:round',isAdmin,ad_form.Approve);
router.post('/CancleApprove/:solutionID/:round',isAdmin,ad_form.CancleApprove);
module.exports = router;