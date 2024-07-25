
const express = require('express');

const adminController = require('../controllers/admin.js');
const isAuth = require('../middlewares/is-auth')
const isAdmin = require('../middlewares/is-admin')

const router = express.Router();

// **************************
// ***     Admin Page     ***
// **************************
router.get('/', isAdmin, adminController.getAdPage);

router.get('/history', isAdmin, adminController.getHistoryPage);
// **************************
// ***     City Page     ***
// **************************
router.get('/city', isAdmin, adminController.getAdCityP);
router.get('/city/:cityID', isAdmin,adminController.getAdCityDataP);
router.get('/city/edit/:cityID', isAdmin, adminController.getEditProvince);
router.post('/city/update/:cityID', isAdmin, adminController.postUpdateProvince);
router.get('/addCity',isAdmin,adminController.getAddCity)
router.post('/postAddCity',isAdmin,adminController.postAddCity)
router.get('/solution/add/:cityID' , isAdmin,adminController.getAddSolutionPage);
router.post('/addSolution',isAdmin,adminController.postAddSolution)
router.get('/notification/:CityID', isAdmin, adminController.notification);
router.get('/solution/edit/:solutionID', isAdmin, adminController.getEditSolution);
router.get('/solution/delete/:solutionID/:cityID', isAdmin, adminController.deleteSolution);
router.get('/question', isAdmin, adminController.getQuestion);
router.get('/question/:QID', isAdmin, adminController.postDeleteQuestion);
router.post('/addQuestion', isAdmin, adminController.getAddQuestion);
router.get('/kpi/:solutionID', isAdmin, adminController.getkpi);
router.post('/saveKpi/:solutionID', isAdmin, adminController.postkpi)
router.post('/updateSolution/:solutionID', isAdmin, adminController.updateSolution)
router.get('/round',isAdmin,adminController.getRoundPage)
router.post('/openform',isAdmin,adminController.postRound)
module.exports = router;
