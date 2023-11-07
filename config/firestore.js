const admin=require('firebase-admin');
const serviceAccount = require("../doctor-hunt-8afcb-firebase-adminsdk-1l68q-82b37e3739.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "gs://doctor-hunt-8afcb.appspot.com"
  });  
  const storage=admin.storage().bucket();

  module.exports=storage;

