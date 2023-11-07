const mongoose=require('mongoose');
const Schema=mongoose.Schema;
const CommunitySchema=new Schema({
    type:{
        type:String,
        default:'community'
    },

    
    name:{
        type:String,
        required:true,
        default:''
    },
    description:{
        type:String,
        required:true,
        default:''
    },
    images:{
        type:Array,
        default:[]
    },
    date:{
        type:Date,
        default:Date.now
    },
   members:[
    {
                type:Schema.Types.ObjectId,
                ref:'User'
            }
           
        ],
    posts:[
        {
            type:Schema.Types.ObjectId,
            ref:'Post'
        }
    ],
    polls:[
        {
            type:Schema.Types.ObjectId,
            ref:'Poll'
        }
    ],
    tags:[String],
    
  
    

          
});

module.exports=Community=mongoose.model('Community',CommunitySchema);