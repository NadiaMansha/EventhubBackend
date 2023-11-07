const File = require('../models/File');

const fileUpload= async (req, res) => {
    try {
      const { filename: fileName, mimetype: fileType, path: filePath } = req.file;
      const fileUrl = `/public/uploads/${fileName}`;
    const file =await File.create({
        fileName,
        fileType,
        filePath,
    });
      res.json({ 
        success: true,
        fileUrl: fileUrl,
        message: 'File uploaded successfully'

       });  
      
    } catch (error) {
   
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
}
module.exports=fileUpload
  
  