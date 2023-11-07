const mongoose=require('mongoose');
const Schema=mongoose.Schema;
const VerificationSchema=new Schema({
   fullName:{
         type:String,
            required:true
   },
   dateOfBirth:{
            type:Date,
            required:true
    },
    Address:{
            type:String,
    },
Postocde:{
            type:String,
    },
City:{
            type:String,
    },
State:{
            type:String,
    },
    idCard:{
        type:Array,
    }
});
module.exports=mongoose.model('Verification',VerificationSchema);