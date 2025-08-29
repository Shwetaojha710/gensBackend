const express = require('express');
const router = express.Router();
const {Admin} = require('../middleware/auth');
const upload = require('../middleware/upload');
const { addDocument, updateDocument, deleteDocument, getDocument, deleteDocumentField } = require('../controller/tenant/document');

router.post('/createDocument', Admin, upload.any(), addDocument); 
router.post('/editDocument', Admin, upload.any(), updateDocument);
router.post('/getDocument', Admin, getDocument);
router.post('/deleteDocument', Admin, deleteDocument);

module.exports = router;