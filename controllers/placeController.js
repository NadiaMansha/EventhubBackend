const Place=require('../models/Place');
const User=require('../models/User');
const { uploadOnAws } = require('../s3');
const sendEmail = require('../utils/mail');
const stripe=require('stripe')(process.env.STRIPE_SECRET_KEY);
const calculateDistance=require('../utils/distance');

const Booking=require('../models/Booking');





//@desc Get all places
//@route GET /api/v1/places
//@access Public
const getPlaces=async(req,res)=>{
    try {
         
     
        const { lat, lng } = req.query;
        const places=await Place.find();
        const bookedPlaces=await Booking.find();
        
        if(lat && lng){
        var nearbyPlaces=places.filter(place=>{
            const distance=calculateDistance(lat,lng,place.lattitude,place.longitude);
            
            if(distance<=5){
                return true;
            }
            return false;
        });
    }
    if(lat==0 && lng==0){
        nearbyPlaces=places;
    }
    
    else{
        nearbyPlaces=places;
    }
    
        res.status(200).json({
            success:true,
            places:nearbyPlaces,
            message:'Places near you'
        });
    } catch (error) {
        res.status(400).json({
            success:false,
            message:'Error in getting places',
            error:error.message
        });
    }
}

const getPlacesForAdmin=async(req,res)=>{
    try {
        const places=await Place.find();
        res.status(200).json({
            success:true,
            places:places,
            message:'Places fetched successfully'
        });
    } catch (error) {
        res.status(400).json({
            success:false,
            message:'Error in getting places',
            error:error.message
        });
    }
}


//@desc Get single place
//@route GET /api/v1/places/:id
//@access Public
const getPlace=async(req,res)=>{
    try {
        const place=await Place.findById(req.params.id).populate('creator');
        if(!place){
            return res.status(400).json({
                success:false,
                message:'Place not found'
            });
        }

        res.status(200).json({
            success:true,
            data:place,
            message:'Place fetched successfully'
        });
    } catch (error) {
        res.status(400).json({
            success:false
        });
    }
}


//@desc Create a place
//@route POST /api/v1/places
//@access Private
const createPlace=async(req,res)=>{

    const {name,description,address,services,tags,
        lattitude,longitude,price,startTime,endTime,numberOfPeople
    }=req.body;
    const  operatingHours={
        startTime:startTime,
        endTime:endTime
    }
    const images=[]
    for(let file of req.files){
         const name= await uploadOnAws(file);
            images.push(name);
    }
    try {
    const place= await Place.create({
        name,
        description,
        address,
        images,
        services,
        creator:req.user._id,
        lattitude,
        longitude,
        price,
        numberOfPeople,
        operatingHours
      
    });
    if(tags){
       place.tags=tags;
    }
    await place.save();



    res.status(201).json({
        success:true,
        data:place,
        message:'Place created successfully'
    });
    }
    catch(error){
        res.status(400).json({
            success:false,
            message:'Error in creating place',
            error:error.message
        });
    }
}

//@desc Update a place
//@route PUT /api/v1/places/:id
//@access Private
const updatePlace=async(req,res)=>{
    const {name,description,address,services,tags,lattitude,longitude,price,startTime,endTime,numberOfPeople}=req.body;
 

    try {
        if(!req.params.id){
            return res.status(400).json({
                success:false,
                message:'Place id is required'
            });
           
        }
        const place=await Place.findById(req.params.id);
        if(!place){
            return res.status(400).json({
                success:false,
                message:'Place not found'
            });
        }
    
        if(name){
             place.name=name;
        }
        if(description){
                place.description=description;
            }
        if(address){
                place.address=address;
            }
      
        if(services){
                place.services=services;
            }
         if(req.files){
            const images=[]
            for(let file of req.files){
                    const name= await uploadOnAws(file);
                    images.push(name);
            }
            place.images=images;
            }
            
            if(tags){
                place.tags=tags;
            }
           
        if(lattitude){
                place.lattitude=lattitude;
            }
        if(longitude){
                place.longitude=longitude;
            }
        if(price){
                place.price=price;
            }
        if(startTime && endTime){
                place.creditHours={
                    startTime,
                    endTime
                }
            }
        if(numberOfPeople){
                place.numberOfPeople=numberOfPeople;
            }



        await place.save();
        res.status(200).json({
            success:true,
            data:place,
            message:'Place updated successfully'
        });

    }
    catch(error){
        res.status(400).json({
            success:false,
            message:'Error in updating place',
            error:error.message
        });
    }
}

//@desc book a place
//@route POST places/:id/book
//@access Private
const bookPlace=async(req,res)=>{
    try {
   
        const place=await Place.findById(req.params.id);
        if(!place){
            return res.status(400).json({
                success:false,
                message:'Place not found'
            });
           
          
        }
     
     let { fullName,date,startTime,endTime,hours ,cardNumber,month,year,cvv} = req.body;
 


    
        
        const user=await User.findById(req.user._id);
        const creator=await User.findById(place.creator);
         const amount=place.price*hours;
      
        

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
        email: req.user.email,
        name: fullName,
        
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
    
        const charge=await stripe.charges.create({
            amount:amount*100,
            currency:'myr',
            customer:customer.id,
            description:`Booking for ${place.name} from ${date} ${startTime} to ${endTime}`
        });
       const booking= await Booking.create({
        user:req.user._id,
        placeId:place._id,
        date,
        startTime,
        endTime,
        hours,
        totalAmount:amount,
        status:'confirmed',
        paymentId:charge.id
         });




        if(booking){
            if(user.email && user.email!=='' && user.isEmailNotificationEnabled){

            sendEmail(
                user.email,
                'Booking Confirmation',
               `Your booking for ${place.name} from ${date} ${startTime} to ${endTime} has been confirmed`
            );
            }
            if(user.fcm && user.fcm !== null && user.isPushNotificationEnabled){
                var message = {
                  to: user.fcm,
                  notification: {
                    title: 'Booking Confirmation',
                    body: `Your booking for ${place.name} from ${date} ${startTime} to ${endTime} has been confirmed`,
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
        
           
            if(creator.email && creator.email!=='' && creator.isEmailNotificationEnabled){
            sendEmail(
                creator.email,
               'Booking Confirmation',
                `Your place ${place.name} has been booked by ${req.user.username} from ${date} ${startTime} to ${endTime}`
            );
            }
        
        }
        if(creator.fcm && creator.fcm !== null && creator.isPushNotificationEnabled){
            var message = {
              to: creator.fcm,
              notification: {
                title: 'Booking Confirmation',
                body: `Your place ${place.name} has been booked by ${req.user.username} from ${date} ${startTime} to ${endTime}`,
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
            success:true,
            message:'Booking successful with 1rm service charge',
            data:charge,
            booking:booking
        });


    }
    catch(error){
        res.status(400).json({
            success:false,
            message:'Error in booking place',
            error:error.message
        });
  
    } 
}





      
//@desc delete a place
//@route DELETE /api/v1/places/:id
//@access Private
const deletePlace=async(req,res)=>{
    const place=await Place.findById(req.params.id);
            if(!place){
                return res.status(400).json({
                    success:false,
                    message:'Place not found'
                });
            }
    try { 
           await Place.findByIdAndDelete(req.params.id);
            res.status(200).json({
                success:true,
                data:{},
                message:'Place deleted successfully'
            });

        }

    catch (error) {
        res.status(400).json({
            success:false,
            message:'Error in deleting place',
            error:error.message
        });
    }
}

//@desc searching a place
//@route GET /api/v1/places/search
//@access Public
const searchPlace=async(req,res)=>{
    try {
        const {name,location}=req.query;
        const places=await Place.find({
            $or:[
                {name:{$regex:name,$options:'i'}},
                {address:{$regex:location,$options:'i'}}
            ]
        });
        res.status(200).json({
            success:true,
            data:places,
            message:'Places fetched successfully'
        });
    } catch (error) {
        res.status(400).json({
            success:false,
            message:'Error in fetching places',
            error:error.message
        });
    }
}


//@desc get booked places for admin
//@route GET /api/v1/places/booked
//@access Private
const getBookedPlaces=async(req,res)=>{
    try {
          const bookings=await Booking.find().populate({
                path:'placeId',
                populate:{
                    path:'creator'
                }  } ).populate('user').populate('paymentId');
        res.status(200).json({
            success:true,
            data:bookings,
            message:'Booked places fetched successfully'
        });
    } catch (error) {
        res.status(400).json({
            success:false,
            message:'Error in fetching booked places',
            error:error.message
        });
    }
}

//desc get a place booked
//@route GET /api/v1/places/:id/booked
//@access Private
const getPlaceBooked=async(req,res)=>{
    try {
        const booking=await Booking.findById(req.params.id).populate({
            path:'placeId',
            populate:{
                path:'creator'
            }  } ).populate('user')
        res.status(200).json({
            success:true,
            data:booking,
            message:'Booked place fetched successfully'
        });
    } catch (error) {
        res.status(400).json({
            success:false,
            message:'Error in fetching booked place',
            error:error.message
        });
    }
}


//@desc delete a booking by id
//@route DELETE /api/v1/places/booked/:id
//@access Private
const deleteBooking=async(req,res)=>{
    try {
        const booking=await Booking.findById(req.params.id);
        if(!booking){
            return res.status(400).json({
                success:false,
                message:'Booking not found'
            });
        }
        await Booking.findByIdAndDelete(req.params.id);
        res.status(200).json({
            success:true,
            data:{},
            message:'Booking deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            success:false,
            message:'Error in deleting booking',
            error:error.message
        });
    }
}


//@desc send response to user
//@route POST /api/v1/places/booked/:id
//@access Private
const sendResponse=async(req,res)=>{
    try {
        const {email,message,subject}=req.body;
        email && sendEmail(email,subject,message);
        res.status(200).json({
            success:true,
            data:{},
            message:'Response sent successfully'
        });
    } catch (error) {
        res.status(400).json({
            success:false,
            message:'Error in sending response',
            error:error.message
        });
    }
}

const bookPlaceByFPX = async (req, res) => {
    const { placeId ,hours,fullName,date,startTime,endTime} = req.body;
    const place=await Place.findById(placeId);
     try{
    const amount=place.price*hours;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      payment_method_types: ['card', 'fpx'],
      line_items: [{
        price_data: {
          
          // To accept `fpx`, all line items must have currency: myr
          currency: 'myr',
          product_data: {
            name: place.name,
          },
          unit_amount: amount*100,
        },
        quantity: seats,
      }],
      mode: 'payment',
      success_url: 'https://api.sociahubadmin.online/success',
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


module.exports={
    getPlaces,
    getPlace,
    createPlace,
    updatePlace,
    bookPlace,
    getPlacesForAdmin,
    deletePlace,
    searchPlace,
    getBookedPlaces,
deleteBooking,
    getPlaceBooked,
    sendResponse
 
}

   


