const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  title: {
    type: String,
  
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
    },
    eventAddress: {
        type:String,
    },
    price: {
        type:Number,
      
    },
    seats: {
        type:Number,
    },
    paymetDate: {
        type:Date,
       
    },
    paymentMethod: {
        type:String,
       
    },
    paymentStatus: {
        type:String,
    },
    chargeId: {
        type:String,
    },
    
    name:{
        type:String,
    },
    phone:{
        type:String,
    },


    
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
