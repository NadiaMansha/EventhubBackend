const mongoose=require('mongoose');
const Schema=mongoose.Schema;
const PostSchema=new Schema({
    type:{
        type:String,
        default:'post'
    },
    
    postType:{
        type:String,
        default:"post"
        
    },
    community:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Community'
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    title:{
        type:String,
        required:true
    },
   body:{
        type:String,
        required:true
   },
   file:{
        type:String,
   },
    tags:[
        {
            type:String
        }
    ],
    date:{
        type:Date,
        default:Date.now
    },
    likes:[

        {
            user:{
                type:mongoose.Schema.Types.ObjectId,
                ref:'User'
            },
            post:{
                type:mongoose.Schema.Types.ObjectId,
                ref:'Post'
            }
           
        }
    ],
    comments:[
        {
        type:mongoose.Schema.Types.ObjectId,
                ref:'Comment'
        }
    ],
    isLiked:{
        type:Boolean,
        default:false
    },
    isBookmarked:{
        type:Boolean,
        default:false
    },
});
module.exports=Post=mongoose.model('Post',PostSchema);