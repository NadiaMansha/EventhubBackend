const mongoose=require('mongoose');
const Schema=mongoose.Schema;
const CommentSchema=new Schema(
    {
        user:{
            type:Schema.Types.ObjectId,
            ref:'User'
        },
        post:{
            type:Schema.Types.ObjectId,
            ref:'Post'
        },
        event:{
            type:Schema.Types.ObjectId,
            ref:'Event'
        },
        poll:{
            type:Schema.Types.ObjectId,
            ref:'Poll'
        },
        text:{
            type:String,
            required:true
        },
        date:{
            type:Date,
            default:Date.now
        }
    }
);
module.exports=Comment=mongoose.model('Comment',CommentSchema);