const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();

// Set up the storage engine for uploaded images
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: (req, file, callback) => {
    callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Initialize multer middleware to handle file uploads
const upload = multer({ dest: 'uploads/' }).array('images')
 

const idCardUpload=multer({dest:'uploads/'}).array('idCard')


module.exports = {
  
  upload: upload,
  idCardUpload:idCardUpload
};

