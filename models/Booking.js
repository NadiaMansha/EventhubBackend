const mongoose= require('mongoose');
const Schema=mongoose.Schema;
const BookingSchema=new Schema({
   placeId:{
         type:mongoose.Types.ObjectId,
            ref:'Place',
            required:true
        },
        hours:{
            type:Number,
        },
        date:{
            type:Date,
        },
        startTime:{
            type:String,
        },
        endTime:{
            type:String,
        },
        totalAmount:{
            type:Number,
        },
        user:{
            type:mongoose.Types.ObjectId,
            ref:'User',
            required:true
        },
      
        paymentId:{
            type:String,
        },
        status:{
            type:String,

        },
        fullName:{
            type:String,
        },
        images:{
            type:Array,
        }
    });
module.exports=mongoose.model('Booking',BookingSchema);
