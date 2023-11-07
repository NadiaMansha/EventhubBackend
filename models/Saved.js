const mongoose=require('mongoose');
const Schema=mongoose.Schema;
const Saved=new Schema({
    user:{
        type:Schema.Types.ObjectId,
        ref:'User'
    },
    event:{
        type:Schema.Types.ObjectId,
        ref:'Event'
    },
    poll:{
        type:Schema.Types.ObjectId, 
        ref:'Poll'
    },
    date:{
        type:Date,
        default:Date.now
    },
    post:{
        type:Schema.Types.ObjectId,
        ref:'Post'
    },
  
});
module.exports=mongoose.model('Saved',Saved);
