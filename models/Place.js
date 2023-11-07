const mongoose=require('mongoose');
const Schema=mongoose.Schema;
const PlaceSchema=new Schema({
    type:{
        type:String,
        default:'place'
    },

    name:{
        type:String,
        required:true
    },
    creator:{
        type:mongoose.Types.ObjectId,
        ref:'User',
        required:true
    },
   
    description:{
        type:String,

    },
    address:{
        type:String,
        required:true
    },
    images:{
        type:[String],
    },
   
    services:{
        type:[String],
    },
    tags:[String],
lattitude:{
    type:Number,
},
longitude:{
    type:Number,
},
    createdAt:{
        type:Date,
        default:Date.now
    },
    updatedAt:{
        type:Date,
        default:Date.now
    },
    price:{
        type:Number,
    },
    numberOfPeople:{
        type:Number,
    },
    operatingHours:{
        startTime:String,
        endTime:String
    }
    


});
module.exports=mongoose.model('Place',PlaceSchema);

