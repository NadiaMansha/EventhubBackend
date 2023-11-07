const express=require('express');
const router=express.Router();
const  {
  createPoll,
  getPoll,
  deletePoll,
  likePoll,
  unlikePoll,
  commentOnPoll,
  deleteCommentOnPoll,
  savePoll,
  unsavePoll,
  getSavedPolls,
  likePollOption,
  updatePoll
  }=require('../controllers/pollContoller');
const {isAuthenticatedUser}=require('../middlewares/authorize');
router.route('/post/:id/createPoll').post(
    isAuthenticatedUser,
    createPoll)
  
router.route('/poll/:id').get(isAuthenticatedUser,getPoll).delete(isAuthenticatedUser,deletePoll);
router.route('/poll/like/:id').put(isAuthenticatedUser,likePoll);
router.route('/poll/unlike/:id').put(isAuthenticatedUser,unlikePoll);
router.route('/poll/comment/:id').put(isAuthenticatedUser,commentOnPoll);
router.route('/poll/comment/:id/:comment_id').delete(isAuthenticatedUser,deleteCommentOnPoll);
router.route('/poll/save/:id').put(isAuthenticatedUser,savePoll);
router.route('/poll/unsave/:id').put(isAuthenticatedUser,unsavePoll);
router.route('/poll/saved').get(isAuthenticatedUser,getSavedPolls);
router.route('/poll/likeOption/:id').put(isAuthenticatedUser,likePollOption);
router.route('/poll/update/:id').put(isAuthenticatedUser,updatePoll);
module.exports=router;
