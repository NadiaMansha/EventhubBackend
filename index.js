require("dotenv").config();
const express = require("express");
const app = express();
const FCM=require('fcm-node');
const morgan = require("morgan");
const PORT = process.env.PORT || 5000;
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const dbConnection = require("./config/dbConnection");
const {feed}=require('./controllers/eventContoller')
const {isAuthenticatedUser}=require('./middlewares/authorize');
const { sharePost } = require("./controllers/postController");

const {loggers,logEvents}=require('./middlewares/logger')
const errorHandler=require('./middlewares/errorHandler')
const Ticket = require('./models/Ticket')

// Connect to MongoDB
dbConnection();
 //handling uncaught exceptions
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log("Shutting down due to uncaught exception");
  process.exit(1);
});
//handling uncaught promise rejections
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  console.log('Eror location: ', err.stack)
  console.log("Shutting down the server due to Unhandled Promise rejection");
  server.close(() => {
    process.exit(1);
  });
});


//middlewares
app.use(loggers);
app.use(cors({
  origin: '*', // allow to server to accept request from different origin
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'], // allow methods
  credentials: true, // allow session cookie from browser to pass through
  cacheControl: 'no-cache',
  


}));

//handle form data
app.use(express.urlencoded({ extended: false }));


//hanlde json data
app.use(express.json());
//handle static files
app.use(express.static(path.join(__dirname, "public")));
//routes
app.use("/users", require("./routes/userRoute"));
app.use("/events", require("./routes/eventRoute")); 
app.use("/places", require("./routes/placeRoute"));
app.use("/communities", require("./routes/communityRoute"));
app.use("/", require("./routes/postRoute"));
app.use("/", require("./routes/pollRoute"));
app.use("/", require("./routes/feedbackRoute"));

const fcm=new FCM(process.env.SERVER_KEY);
app.post("/send_notification", (req, res) => {
  let body = req.body;
  var message = {
    to: body.token,
    notification: {
      title: body.title,
      body: body.body,
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
});


//default route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "view", "index.html"));
});

// Set up a route to serve image files
app.get('/images/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  const imagePath = path.join(__dirname, 'public', 'uploads', fileName);

  // Send the image file to the client
  res.sendFile(imagePath);
});

app.get("/ticket/:id", async (req, res) => {
  res.sendFile(path.join(__dirname, "view", "success.html"));
  
 
});
app.get("/resetpassword", (req, res) => {
  const { email, token } = req.query;
  res.sendFile(path.join(__dirname, "view", "reset-password.html"));
});
app.get("/success", async(req, res) => {
  const {eventId,userId,seats}=req.query;
  const event=await Event.findById(eventId);
  const amount=seats*event.price;
  const ticket= await Ticket.create({
    title: "General",
    user: userId,
    event: eventId,
    seats: seats,
    price: amount,
    eventAddress: event.address,
    paymetDate: Date.now(),
    paymentStatus: "Paid",
    paymentMethod: "fpx",
  });
    
  res.redirect(`http://localhost:5000/ticket/${ticket._id}`);
});
app.get("/failure", (req, res) => {
  res.sendFile(path.join(__dirname, "view", "cancel.html"));
});

app.get('/feed',isAuthenticatedUser,feed);

app.get('/sharePost/:id', sharePost);

app.use(errorHandler)
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

mongoose.connection.on('error', err => {
  console.log(err)
  logEvents(`${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`, 'mongoErrLog.log')
})
  module.exports = app;