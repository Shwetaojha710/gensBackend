const router = require('express').Router();
const { getDashboardData } = require('../controller/tenant/dashboard');
const {createEmploymentType, getEmploymentTypes, editEmploymentType, deleteEmploymentType, getEmpDD,deleteHolidayType,editHolidayType,getHolidayTypes,createHolidayType,getHolidayTypeDD} = require('../controller/tenant/employmentType');
const {Admin} = require('../middleware/auth');

router.post('/createEmpType', Admin, createEmploymentType);
router.post('/getEmpTypes', Admin, getEmploymentTypes);
router.post('/editEmpType', Admin, editEmploymentType); 
router.post('/deleteEmpType', Admin, deleteEmploymentType); 
router.post('/getEmpTypeDD',Admin, getEmpDD);

router.post('/createHolidayType', Admin, createHolidayType);
router.post('/getHolidayTypes', Admin, getHolidayTypes);
router.post('/editHolidayType', Admin, editHolidayType); 
router.post('/deleteHolidayType', Admin, deleteHolidayType); 
router.post('/getHolidayTypeDD',Admin, getHolidayTypeDD);
router.post('/dashboard',Admin, getDashboardData);

module.exports= router;