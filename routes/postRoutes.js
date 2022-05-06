const express = require('express');
const postControllers = require('../controllers/postControllers');
const router = express.Router();

/* --------------- Routes for Credential Verifications --------------- */

router.get('/login', postControllers.login);
router.get('/register', postControllers.register);
router.get('/forgot', postControllers.forgot);
router.get('/reset', postControllers.reset);

/* --------------- CONTROLLERS for Credential Verifications --------------- */
router.post('/login', postControllers.signin);
router.post('/register', postControllers.signup);
router.post('/forgot', postControllers.forgotten);
router.post('/reset', postControllers.resetting);

/* -------------------- Viewing Pages -------------------- */

router.get('/user', postControllers.view_user);
router.get('/dashboard', postControllers.view_dashboard);
router.get('/inventory', postControllers.view_inventory);
router.get('/archive', postControllers.archiveOpen);
router.get('/sales', postControllers.view_sales);

router.get('/close', postControllers.logout);


/* -------------------- Controllers -------------------- */

/* ------ New Item Inventory ------ */
router.get('/newuser', postControllers.form);
router.post('/newuser', postControllers.create);
/* ------ New Item Sales ------ */
router.get('/addSales', postControllers.createSales);
router.post('/addSales', postControllers.postNewSales);
/* ------ Search Items ------ */
router.post('/inventory', postControllers.findInventory);
router.post('/sales', postControllers.findSales);


/* -------------------- ID controlled -------------------- */
/* ------ Edit Item Inventory ------ */
router.get('/edituser/:product_id', postControllers.edit);
router.post('/edituser/:product_id', postControllers.update);
/* ------ Edit Item Sales ------ */
router.get('/editSales/:salesID', postControllers.editSales);
router.post('/editSales/:salesID', postControllers.updateSales);

router.get('/:product_id',postControllers.delete);
router.get('/sales/:salesID',postControllers.remove);


/* -------------------- Export Router to postController.js -------------------- */
module.exports = router;