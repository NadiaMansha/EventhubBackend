const express=require('express');
const router=express.Router();
const Community=require('../models/Community');
const {isAuthenticatedUser,isAdmin}=require('../middlewares/authorize');
const {
    getCommunities,
    getCommunity,
    createCommunity,
    updateCommunity,
    deleteCommunity,
    joinCommunity,
    leaveCommunity,
    deleteAllCommunities,
    getAllCommunities,
    searchCommunityPosts,
    
} = require('../controllers/communityController');
const {upload}=require('../middlewares/multer');
router.route('/').get(
    getCommunities);
router.route('/join/:id').put(
  
    isAuthenticatedUser,
    joinCommunity);
    router.route('/all').get(isAuthenticatedUser,isAdmin,getAllCommunities);
router.route('/leave/:id').put(
    isAuthenticatedUser,
    leaveCommunity);
router.route('/createCommunity').post(
     isAuthenticatedUser,
     isAdmin,
    upload,
    createCommunity);  
router.route('/updateCommunity/:id').put(
    isAuthenticatedUser,
    isAdmin,
    upload,updateCommunity);
router.route('/deleteCommunity/:id').delete(
    isAuthenticatedUser,
    isAdmin,
    deleteCommunity);
router.route('/:id').put(getCommunity);
router.route('/deleteAll').delete(deleteAllCommunities);
router.route('/searchCommunityPosts').get(searchCommunityPosts);
module.exports=router;
