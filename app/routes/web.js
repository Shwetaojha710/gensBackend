const express = require('express');
const { login, logout } = require('../controller/auth/login');
const Admin = require('../middleware/auth');
const router = express.Router();



router.post('/login',login)
router.post('/logout',Admin,logout)
module.exports = router