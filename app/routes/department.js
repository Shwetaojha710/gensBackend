const express = require('express');
const router = express.Router();
const Admin = require('../middleware/auth');
const {createDepartment, getDepartments, updateDepartment, deleteDepartment, departmentDD} = require('../controller/tenant/department');

router.post('/createDepartment', Admin, createDepartment);
router.post('/getDepartments', Admin, getDepartments);
router.post('/updateDepartment', Admin, updateDepartment);
router.post('/deleteDepartment', Admin, deleteDepartment);
router.post('/department-dd', Admin, departmentDD); 

module.exports= router;