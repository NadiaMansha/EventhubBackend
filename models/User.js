const mongoose = require("mongoose");
const schema = require("mongoose").Schema;
const UserSchema = new schema({

  username: {
    type: String,
    required: [true, "Please provide a name"],
    trim: true,
    maxlength: [50, "Name cannot be more than 50 characters"],
    minLength: [3, "Name cannot be less than 3 characters"],
    default:""
  },
  email: {          type: String,
    required: [true, "Please provide an email"],
    unique: true,
    trim: true,
    maxlength: [50, "Email cannot be more than 50 characters"],
    minLength: [3, "Email cannot be less than 3 characters"],
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    trim: true,

    minLength: [3, "Password cannot be less than 3 characters"],
  },
  role: {
    type: String,
    enum: ["user", "admin","bussiness"],
    default: "user",
  },
  country: {
    type: String,
    default: "",
  },
  state: {
    type: String,
    default: "",
  },
  city: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  longitude: {
    type: Number,
    default: 0,
  },
  latitude: {
    type: Number,
    default: 0,
  },
  bussinessName:{
    type:String,
    default:""

  },
  bussinessAddress:{
    type:String,
    default:""
  },
  bussinessPhone:{
    type:String,
    default:""
  },
 

  token: {
    type: String,
  },
  tokenExpire: {
    type: Number,
  },
  avatar: {
    type: String,
    default: "",
   
  },
  tickets:[
    {
      ticketId:String,
    
      ticketImage:{
        type:Array,
      
      }
    }
  ],
  paymentOption:{
     token:{
        type:String,
        default:""
     },
      customerId:{
        type:String,
        default:""
      }
     
  },
  isPushNotificationEnabled:{
    type:Boolean,
    default:false
  },
  isEmailNotificationEnabled:{
    type:Boolean,
    default:false
  },
  isBussinessApproved:{
    type:Boolean,
    default:false
  },
  fcm:{
    type:String,
    default:""
  },
  communities:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:"Community"

    }
  ],
  events:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:"Event"
    }
  ],
  bankDetails:{
    accountNumber:{
      type:String,
      default:""
    },
    bankName:{
      type:String,
      default:""
    },
    IBAN:{
      type:String,
      default:""
    },

  }
})
const User = mongoose.model("User", UserSchema);
module.exports = User;
