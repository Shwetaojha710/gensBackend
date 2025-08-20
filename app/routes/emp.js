const router = require('express').Router();
const {createEmploymentType, getEmploymentTypes, editEmploymentType, deleteEmploymentType, getEmpDD} = require('../controller/tenant/employmentType');
const Admin = require('../middleware/auth');

router.post('/createEmpType', Admin, createEmploymentType);
router.post('/getEmpTypes', Admin, getEmploymentTypes);
router.post('/editEmpType', Admin, editEmploymentType); 
router.post('/deleteEmpType', Admin, deleteEmploymentType); 
router.post('/getEmpTypeDD',Admin, getEmpDD);

module.exports= router;