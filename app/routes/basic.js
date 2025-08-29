const express = require('express');
const router = express.Router();
const {Admin} = require('../middleware/auth');
const { createBasic, getBasic, updateBasic, deleteBasic, getBasicById } = require('../controller/tenant/basicSalary');

router.post('/createBasic', Admin, createBasic);
router.post('/getBasic', Admin, getBasic);
router.post('/updateBasic', Admin, updateBasic);
router.post('/deleteBasic', Admin, deleteBasic);
router.post('/getBasicSalaryEmployee', Admin, getBasicById);

module.exports = router;