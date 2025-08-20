const express = require('express');
const Admin = require('../middleware/auth');
const { createLeave, getLeaves, updatedLeave, destroy, assignLeave, getLeaveTypes, getLeaveByEmployee, applyForLeave, getAppliedLeaves } = require('../controller/tenant/leave');

const router = express.Router();

router.post('/create-leave',Admin,createLeave)
router.post('/get-leaves',Admin,getLeaves)
router.post('/update-leaves',Admin,updatedLeave)
router.post('/delete-leaves',Admin,destroy)


router.post('/assign-leave',Admin,assignLeave)
router.post('/get-leave-type-dd',Admin,getLeaveTypes)
router.post('/get-leave-by-emp',Admin,getLeaveByEmployee)
router.post('/apply-leave',Admin,applyForLeave)
router.post('/get-applied-leaves',Admin,getAppliedLeaves)
module.exports = router;