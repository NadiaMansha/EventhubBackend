const express=require('express');
const router=express.Router();
const {getFeedbacks,getReports,createFeedback,getFeedback}=require('../controllers/feedbackController');
const {isAuthenticatedUser}=require('../middlewares/authorize');

router.route('/feedbacks').get(isAuthenticatedUser,getFeedbacks);
router.route('/reports').get(isAuthenticatedUser,getReports);
router.route('/createFeedback').post(createFeedback);
router.route('/feedbacks/:id').get(isAuthenticatedUser,getFeedback);
module.exports=router;