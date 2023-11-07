const storage = require('../config/firestore');
const uploadFile = async(file, path) => {
   await storage.upload(path, {
        gzip: true,
        destination: file,
        metadata: {
            contentType:'image/jpeg/png/jpg',
            cacheControl: 'public,max-age=31536000',
        },
    });
    const options = {
		version: 'v2',
		action: 'read',
        expires: Date.now() + 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
	
	};
    const imageUrl = await storage.file(file).getSignedUrl(options)
    const url = imageUrl[0];
    return url;
}

const uploadTextFile=async(file,path)=>{
  await storage.upload(path, {
        gzip: true,
        destination: file,
        metadata: {
            contentType:'text/plain/pdf/docx',
            cacheControl: 'public,max-age=31536000',
        },
    });
    const options = {
        version: 'v2',
        action: 'read',
        expires: Date.now() + 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        
    };
    const fileUrl = await storage.file(file).getSignedUrl(options)
    const url = fileUrl[0];
    return url;
}

async function downloadFile(link) {
    const [bucketName, srcFilename] = link.split('/').slice(3);
    const options = {
      // The path to which the file should be downloaded, e.g. "./file.txt"
      destination: destFilename,
    };

    // Downloads the file
    await storage.bucket(bucketName).file(srcFilename).download(options);

    return `gs://${bucketName}/${srcFilename} downloaded to ${destFilename}.`;
    }


module.exports = {
    uploadFile,
    uploadTextFile,
    downloadFile
}