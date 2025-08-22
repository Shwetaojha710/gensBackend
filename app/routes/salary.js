const express = require('express');
const router = express.Router();
const Admin  = require('../middleware/auth');
const { calculateAttendance ,calculateSalaryComponent} = require('../controller/tenant/salary');

router.post('/calculate-attendance', Admin, calculateAttendance);
router.post('/calculate-salary-component', Admin, calculateSalaryComponent);

module.exports=router;