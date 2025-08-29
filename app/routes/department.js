const express = require('express');
const router = express.Router();
const {Admin} = require('../middleware/auth');
const {createDepartment, getDepartments, updateDepartment, deleteDepartment, departmentDD} = require('../controller/tenant/department');
const { createPrefix, getPrefixs, updatePrefix, deletePrefix } = require('../controller/tenant/prefix');
const { getDesignationDD } = require('../controller/tenant/designation');

router.post('/createDepartment', Admin, createDepartment);
router.post('/getDepartments', Admin, getDepartments);
router.post('/updateDepartment', Admin, updateDepartment);
router.post('/deleteDepartment', Admin, deleteDepartment);
router.post('/department-dd', Admin, departmentDD); 
router.post('/designation-dd', Admin, getDesignationDD); 
router.post('/add-prefix', Admin, createPrefix);
router.post('/get-prefix', Admin, getPrefixs);
router.post('/update-prefix', Admin, updatePrefix);
router.post('/delete-prefix', Admin, deletePrefix);

module.exports= router;