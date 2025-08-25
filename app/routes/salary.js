const express = require('express');
const router = express.Router();
const Admin  = require('../middleware/auth');
const { calculateAttendance ,calculateSalaryComponent, generateSalary} = require('../controller/tenant/salary');

router.post('/calculate-attendance', Admin, calculateAttendance);
router.post('/calculate-salary-component', Admin, calculateSalaryComponent);
router.post('/generate-Salary', Admin, generateSalary);

module.exports=router;