const express = require('express');
const router = express.Router();
const {Admin} = require('../middleware/auth');
const { createWorkExp, getWorkExp, updateWorkExp, deleteWorkExp } = require('../controller/tenant/workExp');

router.post('/createWorkExp', Admin, createWorkExp);
router.post('/getWorkExp', Admin, getWorkExp);
router.post('/updateWorkExp', Admin, updateWorkExp);
router.post('/deleteWorkExp', Admin, deleteWorkExp);

module.exports = router;