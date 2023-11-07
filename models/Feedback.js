const mongoose=require('mongoose');
const Schema=mongoose.Schema;
const FeedbackSchema=new Schema({
    type:{
        type:String,
        default:'feedback'
    },
    profileType:{
        type:String,
        default:'user'
    },
    profile:{
        type:String,
    },
    email:{
        type:String,
    },
    
    category:{
        type:String,
    },
    feedback:{
        type:String,
    },
    report:{
        type:String,
    },
    created_at:{
        type:Date,
        default:Date.now
    },
    status:{
        type:String,
        default:'new'
    },
    file:{
        type:String,
    },
    isAttatchment:{
        type:Boolean,
        default:false
    },
});
module.exports=mongoose.model('Feedback',FeedbackSchema);