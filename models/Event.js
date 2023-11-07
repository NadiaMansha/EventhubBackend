const mongoose=require('mongoose');
const Schema=mongoose.Schema;
const EventSchema=new Schema({
    name:{
        type:String,
       
    },
    Organiser:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
      
    },
    description:{
        type:String,
       
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
    
    address:{
        type:String,
     
    },
    lat:{
        type:Number,
    },
    lng:{
        type:Number,
    },
    postcode:{
        type:String,
       
    },
    distance:{
        type:Number,
    },
    city:{
        type:String,
       
    },
    state:{
        type:String,
        
    },
   price:{
        type:Number,
        default:0
    
    },
    capacity:{
        type:Number,
        default:0
    },
    
    
    image:{
       type:String,
    },

        
    users:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'User'
        }
    ],
  
    ratings:[
        {
            type:'Number',
            maximun:5,
            minimun:0
        }
    ],
        
  
  isSaved:{
        type:Boolean,
        default:false
    },

   
   
    isJoined:{
        type:Boolean,
        default:false
    },
    status:{
        type:String,
        default:'active'
    },
    seatsBooked:{
        type:Number,
        default:0
    }
   

});
module.exports=mongoose.model('Event',EventSchema);