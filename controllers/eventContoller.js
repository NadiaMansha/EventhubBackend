const Event = require("../models/Event");
const User = require("../models/User");
const Ticket = require("../models/Ticket");
const getDistanceFromLatLonInKm = require("../utils/distance");
const uuid = require("uuid").v4;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Comment = require("../models/Comment");
const Saved = require("../models/Saved");
const Community = require("../models/Community");
const Verification = require("../models/Verification");
const { uploadOnAws, DeleteOnAws } = require("../s3");
const CancelBooking = require("../models/CancelBookimg");
const sendEmail = require("../utils/mail");
const calculateDistance = require("../utils/distance");

const {uploadFile} = require("../utils/uploadFile");




async function initiateTransfer(amount, currency, destination) {
  try {
    const transfer = await stripe.transfers.create({
      amount: amount,
      currency: currency,
      destination: destination,
    });
    console.log(transfer);
  } catch (error) {
    console.log(error);
  }
}


//@desc Get all events
//@route GET /events
//@access Public
const getEvents = async (req, res) => {
  try {
    const saveds=await Saved.find({user:req.user._id})
    console.log(saveds)
  console.log(req.user._id)
    const popularEvents = await Event.find({
     status: "active",
    })
      .sort({ users: -1 })
      .populate("users", "username")
      .populate("Organiser", "username");
      popularEvents.forEach(async(event) => {
       
        const issaved=saveds?.findIndex((saved)=>saved.event==event._id)
        console.log(issaved)
        event.isSaved=issaved>-1?true:false
      const isMember=event?.users?.includes(req.user._id)
      event.isMember=isMember
      await event.save()
    });

    const { lat, lng } = req.query;
 
   
  
    const events = await Event.find({
   
      status: "active", })
      .sort({ date: 1 })
      .populate("users", "username")
      .populate("Organiser");
      if(lat&&lng){
   
    var nearbyEvents = events.filter((event) => {
      
      const distance = getDistanceFromLatLonInKm(
        lat,
        lng,
        event.lat,
        event.lng
      );
      console.log(distance)
      return distance <= 5;
    });
    

    nearbyEvents.forEach(async(event) => {
  
      const issaved=saveds?.findIndex((saved)=>saved.event==event._id)
      console.log(issaved)
      event.isSaved=issaved>-1?true:false

      const isMember=event?.users?.includes(req.user._id)
      event.isJoined=isMember?true:false
      await event.save()
    });
  }
  if(lat==0 && lng==0){
    nearbyEvents= await Event.find({
    
      status: "active",
    }).sort({ date: 1 }).populate("users", "username").populate("Organiser").limit(10)
    nearbyEvents.forEach(async(event) => {
     
      const issaved=saveds?.findIndex((saved)=>saved.event==event._id)
      console.log(issaved)
      event.isSaved=issaved>-1?true:false

      const isMember=event?.users?.includes(req.user._id)
      event.isJoined=isMember?true:false
      await event.save()
    } );
  }

  else{
    nearbyEvents= await Event.find({

      status: "active",
    }).sort({ date: 1 }).populate("users", "username").populate("Organiser").limit(10)
    nearbyEvents.forEach(async(event) => {
  
      const issaved=saveds?.findIndex((saved)=>saved.event==event._id)
      event.isSaved=issaved>-1?true:false
      const isMember=event?.users?.includes(req.user._id)
      event.isJoined=isMember?true:false
      await event.save()
    } );
  }
    const upcomingEvents = await Event.find({
    
      status: "active",
      date: { $gte: new Date() },
    })
      .sort({ date: 1 })
      .populate("users", "name")
      .populate("Organiser", "username");
    
    upcomingEvents.forEach(async(event) => {
     
      const issaved=saveds?.findIndex((saved)=>saved.event.toString()==event._id.toString())
   
      event.isSaved=issaved>-1?true:false
     
      const isMember=event?.users?.includes(req.user._id)
      event.isJoined=isMember?true:false
      await event.save()
    });
    if (
      upcomingEvents.length === 0 &&
      nearbyEvents.length === 0 &&
      popularEvents.length === 0
    ) {
      return res
        .status(400)
        .json({ success: false, message: "No event found" });
    }

    res.status(200).json({
      success: true,
      message: "Events fetched successfully",
      popularEvents,
      nearbyEvents,
      upcomingEvents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error in fetching events",
    });
  }
};

//@desc Get all events
//@route GET /events
//@access Public
const getEventsForAdmin = async (req, res) => {
  try {
    const events = await Event.find({isApproved:true,
      status: "active",
    }).sort({ users: -1 }).populate("Organiser");
    res.status(200).json({
      success: true,
      message: "Meetups fetched successfully",
      events: events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error in fetching events",
    });
  }
};

//@desc Get single event
//@route GET /events/:id
//@access Public
const getEvent = async (req, res) => {
  const event = await Event.findById(req.params.id)
    .populate("Organiser")
    .populate("verifcation");

  if (!event) {
    return res.status(400).json({ success: false, message: "No event found" });
  }

  const { userlat, userlong } = req.query;
  if(userlat && userlong){
  const lat = event.lat;
  const long = event.lng;

  const distance = getDistanceFromLatLonInKm(userlat, userlong, lat, long);
  event.distance = distance;
  const isMember = event?.users?.includes(req.user._id);
  event.isJoined = isMember?true:false;
  console.log(distance);

  await Event.findByIdAndUpdate(event._id, event);
  }


  res.status(200).json({
    success: true,
    data: event,
    message: "Event fetched successfully",
  });
};

//@desc get event for admin
//@route GET /events/admin/:id
//@access Private
const getEventForAdmin = async (req, res) => {
  const event = await Event.findById(req.params.id)
    .populate("Organiser")
    .populate("verifcation");
  if (!event) {
    return res.status(400).json({ success: false, message: "No event found" });
  }
  res.status(200).json({
    success: true,
    data: event,
    message: "Event fetched successfully",
  });
};

//@desc Create new event
//@route POST /events
//@access Private
const createEvent = async (req, res) => {
  
  const {
    name,
    description,
    date,
    startTime,
    endTime,
    address,
    price,
  
    capacity,
  } = req.body;

 
 
    const image=await uploadFile(req.file.filename,req.file.path)
  
  
  const Organiser=req.user._id

   try {
  const event = await Event.create({
    name,
    description,
    date,
    startTime,
    endTime,
    address,
   Organiser,
    image,
    price,
 
    capacity,

  });
  const organiser=await User.findById(Organiser)
  organiser?.events?.push(event._id)
  await organiser?.save()
  res.status(201).json({
    success: true,
    message: "Event created successfully",
    data: event,
  });

} catch (error) {
  res.status(500).json({
    success: false,
    error: error.message,
    message: "Error in creating event",
  });
}
}

//@desc add verification to event
//@route POST /events/verification
//@access Private
const addVerification = async (req, res) => {
 
  const { fullName, dateOfBirth, Address, City, State, Postcode } = req.body;
  const event = await Event.findById(req.params.id);
  if (!event) {
    return res.status(400).json({ success: false, message: "No event found" });
  }
  let idCard = [];
  for (let file of req.files) {
    const name = await uploadOnAws(file);
    idCard.push(name);
  }



  try {
    const verification = await Verification.create({
      fullName,
      dateOfBirth,
      Address,
      City,
      State,
      Postcode,
      idCard,
    });
    event.verifcation = verification._id;
    await event.save();
    res.status(201).json({
      success: true,
      message: "Verification added successfully",
      data: event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error in adding verification",
    });
  }
};

//@desc get approveEvent Requests
//@route PUT /events/approve/:id
//@access Private
const getApproveEvent = async (req, res) => {
  try {
    const events = await Event.find({ isApproved: "false" })
      .populate("Organiser")
      .populate("verifcation");
    res.status(200).json({
      success: true,
      data: events,
      message: "Events fetched successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error in fetching events",
    });
  }
};

//@desc Update event
//@route PUT /events/:id
//@access Private
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res
        .status(400)
        .json({ success: false, message: "No event found" });
    }
    const { name, description, date, time, address, price, tags } = req.body;
     
    if (name) {
      event.name = name;
    }
    if (description) {
      event.description = description;
    }
    if (date) {
      event.date = date;
    }
    if (time) {
      event.time = time;
    }
    if (address) {
      event.address = address;
    }
    if (price) {
      event.price = price;
    }
  
    if (tags) {
      event.tags = tags;
    }
    if(req.files){
      let images=[]
      for(let file of req.files){
        const name=await uploadOnAws(file)
        images.push(name)
      }
      event.images=images
    }
    await event.save();
    


 
    res.status(200).json({
      success: true,
      data: event,
      message: "Event updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error in updating event",
    });
  }
};

//@desc search events by name
//@route GET /events/search/:name
//@access Public
const searchEvents = async (req, res) => {
  try {
    const events = await Event.find({
      name: { $regex: req.params.name, $options: "i" },
    })
      .sort({ users: -1 })
      .populate("users", "username")
      .populate("Organiser", "username");
    if (!events) {
      return res
        .status(400)
        .json({ success: false, message: "No event found" });
    }
    if (events.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No event found" });
    }

    res.status(200).json({
      success: true,
      data: events,
      message: "Events fetched successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error in fetching events",
    });
  }
};

//@desc Delete event
//@route DELETE /events/:id
//@access Private
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res
        .status(400)
        .json({ success: false, message: "No event found" });
    }
    for(let image of event.images){
      await DeleteOnAws(image)
    }
    await Event.findByIdAndDelete(req.params.id);
    res
      .status(200)
      .json({ success: true, data: {}, message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error in deleting event",
    });
  }
};

//@desc block an event
//@route PUT /events/block/:id
//@access Private
const blockEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res
        .status(400)
        .json({ success: false, message: "No event found" });
    }
    event.isBlocked = true;
    await event.save();
    res.status(200).json({
      success: true,
      data: event,
      message: "Event blocked successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error in blocking event",
    });
  }
};
//@desc approve an event
//@route PUT /events/approve/:id
//@access Private
const approveEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      "Organiser"
    );
    if (!event) {
      return res
        .status(400)
        .json({ success: false, message: "No event found" });
    }
    event.isApproved = true;
    await event.save();
    if(event.Organiser?.email && event.Organiser?.email!=="" && event.Organiser?.isEmailNotificationEnabled){
    sendEmail(event.Organiser?.email, "Meetup Approved",
    `Your Meetup ${event.name} has been approved by the admin. You can now start selling tickets for your event.`)
    }
    if(event.Organiser.fcm && event.Organiser.fcm !== null && event.Organiser.isPushNotificationEnabled){
      var message = {
        to: event.Organiser?.fcm,
        notification: {
          title: 'Meetup Approved',
          body: `Your Meetup ${event.name} has been approved by the admin. You can now start selling tickets for your event.`,
        },
        data: {
          //you can send only notification or only data(or include both)
          title: "ok cdfsdsdfsd",
          body: '{"name" : "okg ooggle ogrlrl","product_id" : "123","final_price" : "0.00035"}',
        },
      };
    
      fcm.send(message, function (err, response) {
        if (err) {
          console.log("Something has gone wrong!" + err);
          console.log("Respponse:! " + response);
          res.send({
            error: true,
            response,
            err,
          });
        } else {
          console.log("Successfully sent with response: ", response);
          res.send({
            error: false,
            response,
          });
        }
      });
    }
    res.status(200).json({
      success: true,
      data: event,
      message: "Event approved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error in approving event",
    });
  }
};

//@desc reject an event
//@route PUT /events/reject/:id
//@access Private
const rejectEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      "Organiser"
    );
    if (!event) {
      return res
        .status(400)
        .json({ success: false, message: "No event found" });
    }
    if(
      event.Organiser?.email && event.Organiser?.email !== "" && event.Organiser?.isEmailNotificationEnabled)
     {
      sendEmail(event.Organiser?.email, "Meetup Rejected", 
     `Your meetup ${event.name} has been rejected by the admin. Please contact the admin for more details.`)
     }
     if(event.Organiser?.fcm && event.Organiser?.fcm !== "" && event.Organiser?.isPushNotificationEnabled){
     
        var message = {
          to: event.Organiser?.fcm,
          notification: {
            title: 'Meetup Rejected',
            body: `Your meetup ${event.name} has been rejected by the admin. Please contact the admin for more details.`,
          },
          data: {
            //you can send only notification or only data(or include both)
            title: "ok cdfsdsdfsd",
            body: '{"name" : "okg ooggle ogrlrl","product_id" : "123","final_price" : "0.00035"}',
          },
        };
      
        fcm.send(message, function (err, response) {
          if (err) {
            console.log("Something has gone wrong!" + err);
            console.log("Respponse:! " + response);
            res.send({
              error: true,
              response,
              err,
            });
          } else {
            console.log("Successfully sent with response: ", response);
            res.send({
              error: false,
              response,
            });
          }
        });
      }
    await Event.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      data: {},
      message: "Event rejected successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error in rejecting event",
    });
  }
};



//@des like  an event
//@route PUT /events/like/:id
//@access Private
const likeEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res
        .status(400)
        .json({ success: false, message: "No event found" });
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({ success: false, message: "No user found" });
    }
    event.likes.push(user._id);
    await event.save();
    res.status(200).json({
      success: true,
      data: event,
      message: "Event liked successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error in liking event",
    });
  }
};

//@desc unlike an event
//@route PUT /events/unlike/:id
//@access Private
const unlikeEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res
        .status(400)
        .json({ success: false, message: "No event found" });
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({ success: false, message: "No user found" });
    }
    event.likes.pull(user._id);
    await event.save();
    res.status(200).json({
      success: true,
      data: event,
      message: "Event unliked successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error in unliking event",
    });
  }
};

//@desc get liked events for user
//@route GET /events/liked/:id
//@access Private
const getLikedEventsForUser = async (req, res) => {
  try {
    const user = await User.findById(req.params._id);
    if (!user) {
      return res.status(400).json({ success: false, message: "No user found" });
    }
    const events = await Event.find({ likes: req.params._id }).lean();

    res.status(200).json({
      success: true,
      data: events,
      message: "Liked events for user retrieved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error in getting liked events for user",
    });
  }
};

//@desc add comment to event
//@route PUT /events/comment/:id
//@access Private
const addCommentToEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res
        .status(400)
        .json({ success: false, message: "No event found" });
    }
    const { text } = req.body;
    const newComment = {
      text,
      user: req.user._id,
      event: req.params.id,
    };
    const comment = await Comment.create(newComment);
    event.comments.push(comment);
    await event.save();
    res.status(200).json({
      success: true,
      data: event,
      message: "Comment added to event successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error in adding comment to event",
    });
  }
};

//@desc remove comment from event
//@route PUT /events/comment/:id
//@access Private
const removeCommentFromEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res
        .status(400)
        .json({ success: false, message: "No event found" });
    }
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res
        .status(400)
        .json({ success: false, message: "No comment found" });
    }
    event.comments.pull(comment);
    await event.save();
    res.status(200).json({
      success: true,
      data: event,
      message: "Comment removed from event successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error in removing comment from event",
    });
  }
};

//@desc get comments of an event
//@route GET /events/comments/:id
//@access Private
const getCommentsOfEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res
        .status(400)
        .json({ success: false, message: "No event found" });
    }
    const comments = await Comment.find({ event: req.params.id });
    res.status(200).json({
      success: true,
      comments: comments,
      message: "Comments of event fetched successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error in fetching comments of event",
    });
  }
};

//@desc save an event
//@route PUT /events/save/:id
//@access Private
const saveEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res
        .status(400)
        .json({ success: false, message: "No event found" });
    }
    const saved = await Saved.findOne({
      user: req.user._id,
      event: req.params.id,
    });
    if (saved) {
      return res
        .status(400)
        .json({ success: false, message: "Event already saved" });
    }
    const newSaved = {
      user: req.user._id,
      event: req.params.id,
    };
    await Saved.create(newSaved);
    res.status(200).json({
      success: true,
      saved: newSaved,
      message: "Event saved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error in saving event",
    });
  }
};

//@desc unsave an event
//@route PUT /events/unsave/:id
//@access Private
const unsaveEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res
        .status(400)
        .json({ success: false, message: "No event found" });
    }
    const saved = await Saved.findOne({
      user: req.user._id,
      event: req.params.id,
    });
    if (!saved) {
      return res
        .status(400)
        .json({ success: false, message: "No saved event found" });
    }
    await saved.remove();

    res.status(200).json({
      success: true,
      data: event,
      message: "Event unsaved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error in unsaving event",
    });
  }
};

//@desc get saved evnts for user
//@route GET /events/saved
//@access Private
const getSavedEvents = async (req, res) => {
  try {
    const savedEvents = await Saved.find({ user: req.user._id }).populate("event").populate(
    {  path:'event',
      populate: {
        path: 'Organiser',
        model: 'User'
      }
    }
    )

    

    res.status(200).json({
      success: true,
      data: savedEvents,
      message: "Saved events fetched successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error in fetching saved events",
    });
  }
};

//@desc delete all events
//@route DELETE /events
//@access Private
const deleteAllEvents = async (req, res) => {
  try {
    await Event.deleteMany();
    res.status(200).json({
      success: true,
      message: "All events deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error in deleting all events",
    });
  }
};

//@desc make payment
//@route POST /events/payment
//@access Private

const makePayment = async (req, res) => {
  try {
    const { cardNumber, month, year, cvv, name, mobileNumber, seats, email } =
      req.body;
    const user = await User.findById(req.user._id);
    let customer;

    // Check if the user already has a Stripe customer object
    if (user.paymentOption && user.paymentOption.customerId) {
      customer = await stripe.customers.retrieve(user.paymentOption.customerId);
    } else {
      // Create a new Stripe customer object
      const token = await stripe.tokens.create({
        card: {
          number: cardNumber,
          exp_month: month,
          exp_year: year,
          cvc: cvv,
        },
      });

      customer = await stripe.customers.create({
        email: email,
        name: name,
        phone: mobileNumber,
        source: token.id,
      });

      // Update the user's paymentOption field with the new customerId and token
      await user.updateOne({
     
        paymentOption: {
          token: token.id,
          customerId: customer.id,
        },
      });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res
        .status(400)
        .json({ success: false, message: "No event found" });
    }

    var amount =( (event.price * seats )+1)
  
    console.log(amount);

    const idempotencyKey = uuid();
    const charge = await stripe.charges.create(
      {
        amount: amount*100,
        currency: "myr",
        customer: customer.id,
        receipt_email: req.user.email,

        description: `Purchased the event`,
      },
      { idempotencyKey }
    );

    //create ticket for user
    const ticket = await Ticket.create({
      title: "General",
      user: req.user._id,
      event: req.params.id,
      seats: seats,
      price: amount,
      eventAddress: event.address,
      paymetDate: Date.now(),
      paymentStatus: "Paid",
      paymentMethod: "Card",
      chargeId: charge.id,
      name: name,
      phone: mobileNumber,
      email: email,
    });
    event.users?.push(req.user._id);
    event.seatsBooked += seats;
    await event.save();
     user.events?.push(req.user._id);
    await user.save();
    res.status(200).json({
      success: true,
      data:charge,
      ticket: ticket,
      message: "Payment made successfully with 1rm service charge",
    });

  }
  catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error in making payment",
    });
  }
};


//@desc book free event
//@route POST /events/bookfree
//@access Private
const bookFreeEvent = async (req, res) => {
  try {
    const { seats } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "No user found" });
    }
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res
        .status(400)
        .json({ success: false, message: "No event found" });
    }
    const ticket = await Ticket.create({
      title: "General",
      user: req.user._id,
      event: req.params.id,
      seats: seats,
      price: 0,
      eventAddress: event.address,
    });
    event.users.push(req.user._id);
    await event.save();
    user.events.push(req.user._id);
    await user.save();
  





    res.status(200).json({
      success: true,
      data: ticket,
      message: "Event booked successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error in booking event",
    });
  }
};


     


//@desc cancel booking for event and refund
//@route POST /events/cancel/:id
//@access Private
const cancelBooking = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);


    if (!ticket) {
      return res
        .status(404)
        .json({ success: false, message: "No ticket found" });
    }
   
    const user = await User.findById(req.user._id);
    const eventId = ticket.event?.toString();
    const event = await Event.findById(eventId);
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "No event found" });
    }
    const refund = await stripe.refunds.create({
      charge: ticket.chargeId,
      amount: ticket.price ,
    });
    await CancelBooking.findByIdAndDelete(req.body. bookingId);
    await user.tickets.pull(req.params.id);
    await Ticket.findByIdAndDelete(req.params.id);
    await event.users.pull(req.user._id);
    await event.save();
    await user.save();
   if(user.email && user.email !== null && user.isEmailNotificationEnabled){
    sendEmail(
      user.email,
      "Ticket cancelled",
      `Your ticket for ${event.title} has been cancelled successfully.`
    );
    }
    if(user.fcm && user.fcm !== null && user.isPushNotificationEnabled){
      var message = {
        to: user.fcm,
        notification: {
          title: 'Ticket cancelled',
          body: `Your ticket for ${event.title} has been cancelled successfully.`,
        },
        data: {
          //you can send only notification or only data(or include both)
          title: "ok cdfsdsdfsd",
          body: '{"name" : "okg ooggle ogrlrl","product_id" : "123","final_price" : "0.00035"}',
        },
      };
    
      fcm.send(message, function (err, response) {
        if (err) {
          console.log("Something has gone wrong!" + err);
          console.log("Respponse:! " + response);
          res.send({
            error: true,
            response,
            err,
          });
        } else {
          console.log("Successfully sent with response: ", response);
          res.send({
            error: false,
            response,
          });
        }
      });
    }
    res.status(200).json({
      success: true,
      data: ticket,
      message: "Ticket cancelled successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error in cancelling booking",
    });
  }
};

//@desc reject ticket cancel request
//@route POST /events/cancel/:id
//@access Private
const rejectCancelRequest = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res
        .status(404)
        .json({ success: false, message: "No ticket found" });
    }
    const cancelBooking = await CancelBooking.findById(req.body.bookingId).populate("userId")
    if (!cancelBooking) {
      return res
        .status(404)
        .json({ success: false, message: "No cancel request found" });
    }
    if(cancelBooking?.userId?.email && cancelBooking?.userId?. isEmailNotificationEnabled){
      sendEmail(
        cancelBooking.userId.email,
        "Cancel request rejected",
        `Your cancel request for ${ticket.title} has been rejected.`
      );
    }
    if(cancelBooking?.userId?.fcm && cancelBooking?.userId?. isPushNotificationEnabled){
      var message = {
        to: cancelBooking.userId.fcm,
        notification: {
          title: "Cancel request rejected",
          body:`Your cancel request for ${ticket.title} has been rejected.`,
        },
        data: {
          //you can send only notification or only data(or include both)
          title: "ok cdfsdsdfsd",
          body: '{"name" : "okg ooggle ogrlrl","product_id" : "123","final_price" : "0.00035"}',
        },
      };
    
      fcm.send(message, function (err, response) {
        if (err) {
          console.log("Something has gone wrong!" + err);
          console.log("Respponse:! " + response);
          res.send({
            error: true,
            response,
            err,
          });
        } else {
          console.log("Successfully sent with response: ", response);
        }
      });
    }
  

    await cancelBooking.remove();
    res.status(200).json({
      success: true,
      message: "Cancel request rejected successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error in rejecting cancel request",
    });
  }
};



//@desc cancelBooking resquest
//@route POST /events/cancel/:id
//@access Private
const cancelBookingRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res
        .status(404)
        .json({ success: false, message: "No ticket found" });
    }
    const cancelBooking = await CancelBooking.create({
      ticketId: req.params.id,
      reason: reason,
      eventId: ticket.event,
    });
    res.status(200).json({
      success: true,
      message:
        "Cancel booking request sent successfully,you'll be notified when it's approved",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error in cancelling booking",
    });
  }
};

//@desc rate an event
//@route POST /events/rate/:id
//@access Private
const rateEvent = async (req, res) => {
  const { ratings } = req.body;
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res
        .status(400)
        .json({ success: false, message: "No event found" });
    }
    //check if user exists in event
    const userExists = event.users.find(
      (user) => user.toString() === req.user._id.toString()
    );
    if (!userExists) {
      return res
        .status(400)
        .json({ success: false, message: "User not registered for event" });
    }

    event.ratings = ratings;

    await event.save();
    res.status(200).json({
      success: true,
      data: event,
      message: "Event rated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error in rating event",
    });
  }
};

//@desc explore
//@route GET /events/explore
//@access Public
const feed = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const events= await Event.find(
      {
        isApproved: true,
        status: "active",
      }
    )
      .sort({ date: 1 })
      .populate("users", "name")
      .populate("Organiser", "username");
      if(lat && lng){
    var nearbyEvents = events.filter((event) => {
      const distance=calculateDistance(
        lat,
        lng,
        event.lat,
        event.lng,
      )
      return distance <= 100;
    });
   

    nearbyEvents.forEach(async(event) => {
      const isMember = event.users.includes(req.user._id);
      event.isJoined = isMember? true : false;
        await event.save();
    });

  }
  if(lat==0 && lng==0){
    events.forEach(async(event) => {
      const isMember = event.users.includes(req.user._id);
      event.isJoined = isMember? true : false;
        await event.save();
    });
    nearbyEvents=events;
  }



  else{
    events.forEach(async(event) => {
      const isMember = event.users.includes(req.user._id);
      event.isJoined = isMember? true : false;
        await event.save();
    });
    nearbyEvents=events;
  }

    const communities = await Community.find({
      members: { $in: req.user._id },
    });

    const communityPosts = await Post.find({
      community: { $in: communities._id },
    })
      .sort({ date: -1 })
      .populate("user")
      .populate("community", "name")
      .populate("comments", "text");
    res.status(200).json({
      success: true,
      nearbyEvents: nearbyEvents,
      communityPosts: communityPosts,
      message: "feed data fetched successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error in fetching events",
    });
  }
};

//@desc get canclled booking requests
//@route GET /events/cancelled
//@access Private
const getCancelledBookingRequests = async (req, res) => {
  try {
    const cancelBookingRequests = await CancelBooking.find({}).populate(
      "ticketId"
    ).populate("eventId")
    res.status(200).json({
      success: true,
      data: cancelBookingRequests,
      message: "Cancelled booking requests fetched successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error in fetching cancelled booking requests",
    });
  }
};

//@desc mark as completed
//@route POST /events/completed/:id
//@access Private
const markAsCompleted = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(400).json({
        success: false,
        message: "No event found",
      });
    }
    event.status = "completed";
    await event.save();
    res.status(200).json({
      success: true,
      message: "Event marked as completed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error in marking event as completed",
    });
  }
};

//@desc get completed events
//@route GET /events/completed
//@access Private
const getCompletedEvents = async (req, res) => {
  try {
    const events = await Event.find({ status: "completed" })
      .sort({ date: -1 })
      .populate("users", "name")
      .populate("Organiser");
    res.status(200).json({
      success: true,
      data: events,
      message: "Completed events fetched successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error in fetching completed events",
    });
  }
};


//@desc transfer funds to local bank account
//@route POST /events/transfer
//@access Private
const transferFunds = async (req, res) => {
const {amount, bank_account_id,email} = req.body;
const user=await User.findOne({email:email});

initiateTransfer(amount*100,'myr', bank_account_id)
.then((response) => {
    email &&
  sendEmail(
    email,
    "Transfer initiated",
    `Your transfer of ${amount} has been initiated successfully, you'll get amount in 3 or 5 working days.`
  );



  res.status(200).json({
    success: true,
    data: response,
    message: "Transfer initiated successfully",
  });
})
.catch((error) => {
  res.status(500).json({
    success: false,
    error: error.message,
    message: "Error in initiating transfer",
  });

});
};

//fpx payment
const makeFPXPayment = async (req, res) => {
  const { eventId ,seats} = req.body;
  const event= await Event.findById(eventId);
  const user=await User.findById(req.user._id);
   try{
  const amount=event.price*seats;
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    payment_method_types: ['card', 'fpx'],
    line_items: [{
      price_data: {
        
        // To accept `fpx`, all line items must have currency: myr
        currency: 'myr',
        product_data: {
          name: event.name,
        },
        unit_amount: amount*100,
      },
      quantity: seats,
    }],
    mode: 'payment',
    success_url: `https://api.sociahubadmin.online/success?eventId=${eventId}&seats=${seats}&userId=${user._id}`,
    cancel_url: 'https://api.sociahubadmin.online/cancel',
    
  });
  

  res.status(200).json({
    success: true,
    data: session,
    message: "Payment session created successfully",
  });

}
catch(error){
  res.status(500).json({
    success: false,
    error: error.message,
    message: "Error in making payment",
  });


}
};


//get upcomig events joined by user
const getUpcomingEvents = async (req, res) => {
  try {
    const events = await Event.find({
      users: { $in: req.user._id },
      date: { $gte: Date.now() },
    })
      .sort({ date: 1 })
      .populate("users", "name")
      .populate("Organiser", "username");
    res.status(200).json({
      success: true,
      data: events,
      message: "Upcoming events fetched successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in fetching upcoming events",
    });
  }
};

//get past events joined by user
const getPastEvents = async (req, res) => {
  try {
    const events = await Event.find({
      users: { $in: req.user._id },
    status: "completed",
    })
      .sort({ date: -1 })
      .populate("users", "name")
      .populate("Organiser", "username");
    res.status(200).json({
      success: true,
      data: events,
      message: "Past events fetched successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in fetching past events",
    });
  }
};







module.exports = {
  getEvents,
  getEvent,
  createEvent,
  addVerification,
  updateEvent,
  deleteEvent,
  blockEvent,
  approveEvent,
  searchEvents,
  makePayment,
  rateEvent,
  saveEvent,
  unsaveEvent,
  getSavedEvents,
  deleteAllEvents,
  likeEvent,
  unlikeEvent,
  addCommentToEvent,
  removeCommentFromEvent,
  getCommentsOfEvent,
  feed,
  getLikedEventsForUser,
  cancelBooking,
  getEventsForAdmin,
  cancelBookingRequest,
  getEventForAdmin,
  getCancelledBookingRequests,
   rejectEvent,
  getApproveEvent,
  rejectCancelRequest,
  bookFreeEvent,
  markAsCompleted,
  getCompletedEvents,
  transferFunds,
  makeFPXPayment,
  getUpcomingEvents,
  getPastEvents,
};
