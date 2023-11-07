const express=require('express');
const router=express.Router();
const multer=require('multer');
const {isAuthenticatedUser,isAdmin}=require('../middlewares/authorize');
const {
    getEvents,
    getEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    blockEvent,
    approveEvent,
    searchEvents,
    makePayment,
    deleteAllEvents,
    likeEvent,
    unlikeEvent,
    saveEvent,
    unsaveEvent,
    getSavedEvents,
    getCommentsOfEvent,
    addCommentToEvent,
   removeCommentFromEvent,
   rateEvent,
   getLikedEventsForUser,
   cancelBooking,
   addVerification,
   getEventsForAdmin,
   cancelBookingRequest,
   getCancelledBookingRequests,
   getEventForAdmin,
   getApproveEvent,
   rejectEvent,
    rejectCancelRequest,
    bookFreeEvent,
    getCompletedEvents,
    markAsCompleted,
    transferFunds,
    makeFPXPayment,
    getPastEvents,
    getUpcomingEvents

 


} = require('../controllers/eventContoller');

const upload = multer({ dest: 'uploads/' })
router.post('/createEvent',
      isAuthenticatedUser,
    upload.single('image'),
     createEvent);
router.route('/getEventsForAdmin').get(
    isAuthenticatedUser,
    isAdmin,
    getEventsForAdmin);
router.post('/addVerification/:id',upload.array('images'),
    addVerification);
router.route('/getAllEvents').get(
    isAuthenticatedUser,
    getEvents);

router.route('/block/:id').put
isAuthenticatedUser,isAdmin,
(blockEvent);
router.route('/updateEvent/:id').put(
    isAuthenticatedUser,
    isAdmin,
    upload.array('images'),updateEvent)
router.route('/deleteEvent/:id').delete(deleteEvent);
router.route('/event-details/:id').get(
    isAuthenticatedUser,
    getEvent);
router.route('/approveEvent/:id').put(approveEvent);
router.route('/search/:name').get(searchEvents);
router.route('/payment/:id').post( isAuthenticatedUser,  makePayment)
router.route('/rejectEvent/:id').put(isAuthenticatedUser,isAdmin,rejectEvent)
router.route('/deleteAllEvents').delete(deleteAllEvents)
router.route('/likeEvent/:id').put(isAuthenticatedUser,likeEvent)
router.route('/unlikeEvent/:id').put(isAuthenticatedUser,unlikeEvent)
router.route('/saveEvent/:id').put(isAuthenticatedUser,saveEvent)
router.route('/unsaveEvent/:id').put(isAuthenticatedUser,unsaveEvent)
router.route('/getSavedEvents').get(isAuthenticatedUser,getSavedEvents)
router.route('/getCommentsOfEvent/:id').get(getCommentsOfEvent)
router.route('/addCommentToEvent/:id').post(isAuthenticatedUser,addCommentToEvent)
router.route('/removeCommentFromEvent/:id').delete(isAuthenticatedUser,removeCommentFromEvent)
router.route('/rateEvent/:id').put(isAuthenticatedUser,rateEvent)
router.route('/getLikedEventsForUser').get(isAuthenticatedUser,getLikedEventsForUser)
router.route('/cancelBooking/:id').put(isAuthenticatedUser,cancelBookingRequest)
router.route('/confirmCancelTikccet/:id').put(isAuthenticatedUser,cancelBooking)
router.route('/getCancelledBookingRequests').get(isAuthenticatedUser,
    isAdmin
    ,getCancelledBookingRequests)
router.route('/getEventForAdmin/:id').get(getEventForAdmin)
router.route('/getApproveEvents').get(
    isAuthenticatedUser,
    isAdmin,
    getApproveEvent)
router.route('/rejectCancelRequest/:id').put(isAuthenticatedUser,isAdmin,rejectCancelRequest)
router.route('/bookFreeEvent/:id').put(isAuthenticatedUser,bookFreeEvent)
router.route('/getCompletedEvents').get(isAuthenticatedUser
    ,isAdmin
    ,getCompletedEvents)
router.route('/markAsCompleted/:id').put(isAuthenticatedUser,
    isAdmin,
    markAsCompleted)
router.route('/transferFunds/:id').put(isAuthenticatedUser,
    isAdmin,
    transferFunds),
    router.route('/makeFPXPayment').put(isAuthenticatedUser,
       isAuthenticatedUser,
        makeFPXPayment),
        router.route('/getPastEvents').get(isAuthenticatedUser,getPastEvents)
        router.route('/getUpcomingEvents').get(isAuthenticatedUser,getUpcomingEvents)


    








module.exports=router;