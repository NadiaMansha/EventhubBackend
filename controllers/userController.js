const mongoose = require("mongoose");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/mail");
const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");
const nodemailer = require("nodemailer");
const stripe=require("stripe")(process.env.STRIPE_SECRET_KEY);
const Saved=require("../models/Saved");
const Ticket=require("../models/Ticket");
const Event=require("../models/Event");
const Community=require("../models/Community");
const Post=require("../models/Post");
const Comment=require("../models/Comment");
const Poll=require("../models/Poll");
const { uploadOnAws } = require("../s3");
const FCM=require('fcm-node');
const { findByIdAndDelete } = require("../models/Place");
const fcm=new FCM(process.env.SERVER_KEY);


// @desc    Get all users
// @route   GET /users
// @access  private

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").lean();
    if (!users) {
      return res
        .status(400)
        .json({ success: false, message: "No users found" });
    }

    res
      .status(200)
      .json({
        success: true,
        count: users.length,
        data: users,
        message: "Users fetched successfully",
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: error.message,
        message: "Error in fetching users",
      });
  }
};
//@desc create a new user
//@route POST /users/create
//@access public
const createUser = async (req, res) => {
  try {
    const { username, email, password, role ,city,state,country} = req.body;
    //check data
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide all the fields" });
    }
    //check duplicate
    const duplicate = await User.findOne({ email }).lean().exec();
    if (duplicate) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }
    //hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    //create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role,
      city,
      state,
      country
    });
    if (user) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
      });
      res.status(200).json({
        success: true,
        data: user,
        token,
        message: "Signup successful",
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: error.message,
        message: "Error in signing up",
      });
  }
};

//@desc create bussiness account
//@route POST /users/create/bussiness
//@access public
const createBussinessAccount = async (req, res) => {
  try {
    const { username, email, password, bussinessName ,bussinessPhone,bussinessAddress,
      accountNumber,
      bankName,
      IBAN

    } = req.body;
    //check data
    if (!username || !email || !password || !bussinessName || !bussinessPhone || !bussinessAddress) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide all the fields" });
    }
    //check duplicate
    const duplicate = await User.findOne({ email }).lean().exec();
    if (duplicate) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }
    //hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const bankDetails={
      accountNumber,
      bankName,
      IBAN
    }
    //create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role:"bussiness",
      bussinessName,
      bussinessPhone,
      bussinessAddress,
      bankDetails
    });
    if (user) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
      });
      res.status(200).json({
        success: true,
        data: user,
        token,
        message: "Signup successful,Your account is under review",
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: error.message,
        message: "Error in signing up",
      });
  }
};

//@desc get bussiness accounts for admin
//@route GET /users/bussiness
//@access private
const getBussinessAccounts = async (req, res) => {
  try {
    const users = await User.find({role:"bussiness",isBussinessApproved:"false"}).select("-password").lean();
    if (!users) {
      return res
        .status(400)
        .json({ success: false, message: "No users found" });
    }

    res
      .status(200)
      .json({
        success: true,
        count: users.length,
        data: users,
        message: "Users fetched successfully",
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: error.message,
        message: "Error in fetching users",
      });
  }
};



//@desc get a user
//@route GET /users/:id
//@access private
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password").lean();
    if (!user) {
      return res.status(400).json({ success: false, message: "No user found" });
    }
    res
      .status(200)
      .json({
        success: true,
        data: user,
        message: "User fetched successfully",
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: error.message,
        message: "Error in fetching user",
      });
  }
};

//@desc approve bussiness account
//@route PUT /users/approve/:id
//@access private
const approveBussinessAccount = async (req, res) => {
  try {
    const {id} = req.params;
    const user= await User.findById(id);
    if (!user) {
      return res.status(400).json({ success: false, message: "No user found" });
    }
    user.isBussinessApproved="true";
    await user.save();
    sendEmail(user.email,"Bussiness Account Approved","Your bussiness account has been approved. you can now login to your account");
    res
      .status(200)
      .json({
        success: true,
        data: user,
        message: "User approved successfully",
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: error.message,
        message: "Error in approving user",
      });
  }
};

//@desc reject bussiness account
//@route PUT /users/reject/:id
//@access private
const rejectBussinessAccount = async (req, res) => {
  try {
    const {id} = req.params;
    const user=await User.findById(id);
    if (!user) {
      return res.status(400).json({ success: false, message: "No user found" });
    }
    user.isBussinessApproved="false";
    await user.save();
    await User.findByIdAndDelete(id);
    sendEmail(user.email,"Bussiness Account Rejected","Your bussiness account has been rejected. Please contact admin for more details");

    res
      .status(200)
      .json({
        success: true,
        data: user,
        message: "User rejected successfully",
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: error.message,
        message: "Error in rejecting user",
      });
  }
};



//@desc update a user
//@route PUT /users/update/:id
//@access private
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(400).json({ success: false, message: "No user found" });
    }
    const {
      username,
      email,
      password,
      role,
      country,
      city,
      longitude,
      latitude,
      avatar,
      isPushNotificationEnabled,
      isEmailNotificationEnabled,
      name,
      bussinessName,
      bussinessPhone,
      bussinessAddress,
      fcmToken,
    } = req.body;
    if (username) {
      user.username = username;
    }
  
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }
    if (role) {
      user.role = role;
    }
    if (country) {
      user.country = country;
    }
    if (city) {
      user.city = city;
    }
    if (longitude) {
      user.longitude = longitude;
    }
    if (latitude) {
      user.latitude = latitude;
    }
    if (avatar) {
      user.avatar = avatar;
    }
    if (isPushNotificationEnabled) {
      user.isPushNotificationEnabled = isPushNotificationEnabled;
    }
    if (isEmailNotificationEnabled) {
      user.isEmailNotificationEnabled = isEmailNotificationEnabled;
    }
    if (name) {
      user.name = name;
    }
    if (bussinessName) {
      user.bussinessName = bussinessName;
    }
    if (bussinessPhone) {
      user.bussinessPhone = bussinessPhone;
    }
    if (bussinessAddress) {
      user.bussinessAddress = bussinessAddress;
    }
    if (fcmToken) {
      user.fcm = fcmToken;
    }
    


    

    const updateduser = await user.save();
    return res
      .status(200)
      .json({
        success: true,
        user: updateduser,
        message: "User updated successfully",
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: error.message,
        message: "Error in updating user",
      });
  }
};

//@desc update a user's payment option
//@route PUT /users/update/payment/:id
//@access private
const updateUserPayment = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({ success: false, message: "No user found" });
    }
    const { cardNumber, cvv, month, year,name } = req.body;
    const token = await stripe.tokens.create({
      card: {
        number: cardNumber,
        exp_month: month,
        exp_year: year,
        cvc: cvv,
      },
    });
  const customer=await stripe.customers.create({
    email:req.body.email,
    source:token.id,
    name:req.body.name,
  });
 const cardToken=customer.default_source;

    await user.updateOne(
     {
        paymentOption: {
          token: cardToken,
          customerId: customer.id,
      },
    });
    return res
      .status(200)
      .json({
        success: true,
        data: user,
        message: "User's payment option updated successfully",
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: error.message,
        message: "Error in updating user's payment option",
      });
  }
};

//@desc get user's card details from stripe token
//@route GET /users/payment/:id
//@access private
const getUserPaymentDetails = async (req, res) => {

  try {
    const user=await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({ success: false, 
        error: error.message,
        message: "No user found" });
    }
    const cardDetails = await stripe.customers.retrieveSource(
      user.paymentOption?.customerId,
      user.paymentOption?.token
    );
    return res
      .status(200).json({ success: true, cardDetails: cardDetails,
        message: "User's payment option fetched successfully",
      });
  } catch (error) {
    res.status(500).json({  success: false, error: error.message,
        message: "Error in fetching user's payment option",
      });
  }
};

//@desc delete a user
//@route DELETE /users/dlete/:id
//@access private
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(400).json({ success: false,
        error: "No user with such id",
         message: "No user found" });
    }
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, data: {}, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({
        success: false,
        error: error.message,
        message: "Error in deleting user",
      });
  }
};

//@desc loginUser
//@route POST /users/login
//@access public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res .status(400) .json({ success: false, message: "All fields are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }
    if(user.role==='bussiness'){
      if(!user.isBussinessApproved){
        res.status(400).json(
          {
            success:false,
            message:"Your account is yet not approved"
          }
        )
      }

    }
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {});
    res.cookie("token", token, {
      httpOnly: true,
    });
    res.status(200).json({
      success: true,
      data: user,
      token,
      message: "Login successful",
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: error.message,
        message: "Error in logging in",
      });
  }
};

//@desc forgot password
//@route POST /users/forgotpassword
//@access private

// Function to generate a random password reset token
const generateToken = () => {
  const token =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
  return token;
};

// Function to reset a user's password
const forgotPassword = async (req, res) => {
  const email = req.body.email;
  // Check if the user exists
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ success: false, message: "No user found" });
  }
  try {
    // Generate a password reset token
    const token = generateToken();
    // Set the token and token expire time in the user's document
    user.token = token;
    user.tokenExpire = Date.now() + 3600000; // 1 hour
    await user.save();
    const source = path.join(__dirname, "../templates/resetPassword.hbs");
    const template = fs.readFileSync(source, "utf8");
    const compiledTemplate = handlebars.compile(template);
    const reserurl = `
    https://api.sociahubadmin.online/resetpassword?email=${email}&token=${token}`;
    const replacements = {
      token: token,
      email: email,
      username: user.username,
      resetUrl: reserurl,
    };
    const htmlToSend = compiledTemplate(replacements);
    // Send the password reset token to the user's email
    sendEmail(email, "Password Reset", htmlToSend);

    res
      .status(200)
      .json({ success: true, message: "Password reset link sent to email" });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: error.message,
        message: "Error in sending email",
      });
  }
};

const resetPassword = async (req, res) => {
  const password = req.body.password;
  const email = req.query.email;
  const token = req.query.token;
  // Check if the user exists
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ success: false, message: "No user found" });
  }
  // Check if the password reset token is valid
  if (user.token !== token) {
    return res.status(400).json({ success: false, message: "Invalid token" });
  }
  // Check if the password reset token has expired
  if (user.tokenExpire < Date.now()) {
    return res.status(400).json({ success: false, message: "Token expired" });
  }
  // Hash the new password
  const hashedPassword = await bcrypt.hash(password, 10);
  // Update the user's password
  user.password = hashedPassword;
  // Clear the password reset token and expiry

  user.token = null;
  user.tokenExpire = null;

  // Save the user
  await user.save();
  res.status(200).json({ success: true, message: "Password reset successful" });
};



//@desc logout user
//@route GET /users/logout
//@access private
const logoutUser = async (req, res) => {
  try {
    res.clearCookie("token");
    res
      .status(200)
      .json({
        success: true,
        data: {},
        message: "User logged out successfully",
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: error.message,
        message: "Error in logging out user",
      });
  }
};

//@desc upload ticket
//@route POST /users/uploadticket
//@access private

const uploadTicket = async (req, res) => {
  try {
    

    const user = await User.findById(req.user._id);
    const ticketId = req.body.ticketId;
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User does not exist" });
    }
    if(!ticketId){
      return res
        .status(400)
        .json({ success: false, message: "Ticket Id is required" });
    }
    const images=[]
    for (let file of req.files) {
     const name=await uploadOnAws(file)
     images.push(name)
   }
  
     user.tickets.push({
      ticketId: ticketId,
      ticketImage: images,
    });
    await user.save();
    res.status(200).json({
        success: true,
        data: user.tickets,
        message: "Ticket uploaded successfully",
      });
  } catch (error) {
    res.status(500).json({
        success: false,
        error: error.message,
        message: "Error in uploading ticket",
      });
  }
};

//@desc get all tickets for user
//@route GET /users/gettickets
//@access private
const getTickets = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const tickets = user.tickets;
    res.status(200).json({
        success: true,
        tickets: tickets,
        message: "Tickets retrieved successfully",
      });
  } catch (error) {
    res.status(500).json({
        success: false,
        error: error.message,
        message: "Error in retrieving tickets",
      });
  }
};

//@desc gaet saved posts and evnts of user
//@route GET /users/getsavedsByUser
//@access private
const getSavedsByUser = async (req, res) => {
  try {
    const saveds = await Saved.find({ user: req.user._id }).populate("post" ).populate("event").
    populate("poll")
    ;
   
    if(!saveds){
      return res
      .status(404)
      .json({ success: false,
        message: "No saveds found",
      });
    }

    res.status(200).json({
        success: true,
        saveds: saveds,
        message: "Saveds retrieved successfully",
      });
  }
  catch(error){
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error in retrieving saveds",
    });
  }
};





//@desc get events for user
//@route GET /users/userEvents
//@access Private
const getEventsForUser = async (req, res) => {
  try {
    const events = await Event.find({ users: { $in: req.user._id } })
      .sort({ date: -1 });
      if(!events){
        return res.status(404).json({
          success: false,
          message: "No events found",
        });
      }
      if(events.length===0){
        return res.status(404).json({
          success: false,
          message: "No events found",
        });
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

//@desc get user by token
//@route GET /users/getuser
//@access private
const getUserByToken = async (req, res) => {
  try {
    const user= await User.findById(req.user._id);
    if(!user){
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    res.status(200).json({
      success: true,
      data: user,
      message: "User fetched successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error in fetching user",
    });
  }
};


//@desc inteactions
//@route GET /users/interactions
//@access private
const getInteractions = async (req, res) => {
  try {
    const user= await User.findById(req.user._id);
    if(!user){
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
     const posts= await Post.find().populate(
    {
      path:"likes",
      populate:{
        path:"post",
      }
    }

     )
   
     const polls=await Poll.find().populate(
      {
        path:"likes",
        populate:{
          path:"poll",
          
        }
      }
     )
    const likes=[...posts?.map(post=>post.likes)].flat()
   const pollLikes=[...polls?.map(poll=>poll.likes)].flat()
   const postLikes=likes.filter(like=>like.user?.toString()===user._id.toString())
    const userPollLikes=pollLikes.filter(like=>like.user?.toString()===user._id.toString())
    const userLikesAndPollLikes=[...postLikes,...userPollLikes]
    const comments = await Comment.find({ user: user._id }).populate("post").populate("event").populate("poll")
    const postsByUser = await Post.find({ user: req.user._id });
    const pollsByUser=await Poll.find({user:req.user._id});
    res.status(200).json({
      success: true,
      data: {
        likes:userLikesAndPollLikes,
        comments:comments,
        posts:postsByUser,
        polls:pollsByUser
      },
      message: "User interactions fetched successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error in fetching user interactions",
    });
  }
};

//@desc get user by name
//@route GET /users/getuser/:name
//@access private
const getUsersByName = async (req, res) => {
  try {
    const projection = {_id:1,username:1,avatar:1};
    const users=await User.find({username:{$regex:req.query.name,$options:"i"}}).select(projection);
    if(!users){
      return res.status(404).json({
        success: false,
        message: "Users not found",
      });
    }
    res.status(200).json({
      success: true,
      data: users,
      message: "User fetched successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error in fetching user",
    });
  }
};


//@desc add fcm to user
//@route PUT /users/addFCM
//@access private
const addFCM=async(req,res)=>{
  const {fcmToken}=req.body;
  const user=await User.findById(req.user._id)
  if(!user){
    res.status(404).json({
      success:false,
      message:"User not found"
    })
  }


  try{
    user.fcm=fcmToken;
    await user.save();
    res.status(200).json({
      success:true,
      message:"FCM token added successfully"
    })

  }
  catch(error){
    res.status(500).json({
      success:false,
      message:"Error in adding FCM token"
    })
  }
}

//@desc send fcm notification to user by id
//@route POST /users/sendFCM
//@access private
const sendNotification=async(req,res)=>{
  const {id,title,body}=req.body;

  const user=await User.findById(id)
  if(!user){
    res.status(404).json({
      success:false,
      message:"User not found"
    })
  }
  const fcmToken=user.fcm;
  if(!fcmToken){
    res.status(404).json({
      success:false,
      message:"User has no fcm token"
    })
  }
  if(user.isPushNotificationEnabled){
  var message = {
    to: fcmToken,
    notification: {
      title: title,
      body: body,
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
else{
  res.status(404).json({
    success:false,
    message:"User has disabled push notifications"
  })
}

}







module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  loginUser,
  resetPassword,
  forgotPassword,
  uploadTicket,
/*   googleAuth, */
  logoutUser,
  getTickets,
  updateUserPayment,
  getUserPaymentDetails,
  getSavedsByUser,
getInteractions,
  getEventsForUser,
  getUserByToken,
  getUsersByName,
  getBussinessAccounts,
  createBussinessAccount,
  approveBussinessAccount,
  addFCM,
  sendNotification,
rejectBussinessAccount

};
