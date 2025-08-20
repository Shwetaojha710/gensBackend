const express = require('express');
const router = express.Router();
const Admin  = require('../middleware/auth');
const { calculateAttendance } = require('../controller/tenant/salary');

router.post('/calculate-attendance', Admin, calculateAttendance);

module.exports=router;