const express = require('express');
const router = express.Router();
const Admin = require('../middleware/auth');
const { createBankAccnt, getBankAccnt, updateBankAccnt, deleteBankAccnt } = require('../controller/tenant/bankAccnt');

router.post('/createBank',Admin, createBankAccnt);
router.post('/getBank', Admin, getBankAccnt);
router.post('/updateBank', Admin, updateBankAccnt);
router.post('/deleteBank',Admin, deleteBankAccnt);

module.exports=router;