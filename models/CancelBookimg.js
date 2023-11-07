const mongoose=require('mongoose');
const Schema=mongoose.Schema;
const CancelBookingSchema=new Schema({
ticketId:{
type:mongoose.Types.ObjectId,
ref:'Ticket',
required:true
},
eventId:{
type:mongoose.Types.ObjectId,
ref:'Event',

},
placeId:{
type:mongoose.Types.ObjectId,
ref:'Place',
},
reason:{
type:String,
}
});
module.exports=mongoose.model('CancelBooking',CancelBookingSchema);