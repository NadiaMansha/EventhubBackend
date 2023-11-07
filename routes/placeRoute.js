const express=require('express');
const router=express.Router()
const {isAuthenticatedUser,isAdmin}=require('../middlewares/authorize');
const multer=require('multer');
const upload=multer({dest:'uploads/'});



const {getPlaces,getPlace,createPlace,updatePlace,
    getPlacesForAdmin,
    deletePlace,
    bookPlace,
    searchPlace,
    getBookedPlaces,
    getPlaceBooked,
    deleteBooking,
    sendResponse

}=require('../controllers/placeController');
router.route('/getPlaces').get(getPlaces);
router.route('/getPlacesForAdmin').get(
    isAuthenticatedUser,
    isAdmin,
    getPlacesForAdmin);
router.route('/createPlace').post(
    isAuthenticatedUser,
  
    upload.array('images'),
    createPlace);
router.route('/updatePlace/:id').put(
    isAuthenticatedUser,

    upload.array('images'),
    updatePlace);
router.route('/deletePlace/:id').delete(
    isAuthenticatedUser,
    deletePlace);
router.route('/bookPlace/:id').put(
    isAuthenticatedUser,
    upload.array('images'),
    bookPlace);
router.route('/getBookedPlaces').get(
    isAuthenticatedUser,
    isAdmin,
    getBookedPlaces);
router.route('/getPlaceBooked/:id').get(
    isAuthenticatedUser,
    isAdmin,
    getPlaceBooked);
router.route('/searchPlace').get(searchPlace);
router.route('/getPlace/:id').get(getPlace);
router.route('/deleteBooking/:id').delete(
    isAuthenticatedUser,
    deleteBooking);
router.route('/sendResponse/').put(sendResponse);




module.exports=router;
