const express = require('express');
const router = express.Router();
const Admin = require('../middleware/auth');
const { createEmp, getEmp, updateEmp, deleteEmp, uploadImage, getUploadedImage, employeeList } = require('../controller/tenant/empPersonal');
const upload = require('../middleware/upload');

router.post('/createEmp', Admin,upload.single('image'), createEmp);
router.post('/getEmp', Admin, getEmp);
router.post('/updateEmp', Admin, updateEmp);
router.post('/deleteEmp', Admin, deleteEmp);
router.post('/uploadImage', Admin, upload.single('profileImage'), uploadImage);
router.post('/getUploadImage', Admin,getUploadedImage );
router.post('/get-emp-list',Admin,employeeList)

module.exports=router;