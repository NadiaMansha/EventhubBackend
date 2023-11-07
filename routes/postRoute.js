const express = require('express');
const router = express.Router();


const{ 
    getPosts,
    getPost,
    createPost,
    updatePost,
    deletePost,
    likePost,
    unlikePost,
    commentPost,
    deleteComment,
    savePost,
    unsavePost,
    getSavedPosts  ,
    deleteAllPosts,
    explorePosts,

    
  
     
}=require('../controllers/postController');
const {isAuthenticatedUser}=require('../middlewares/authorize');
const { upload } = require('../middlewares/multer');
router.route('/posts/:id').get
(
    isAuthenticatedUser,
  getPosts);
router.route('/post/:id').get(
    isAuthenticatedUser,
  getPost);
router.route('/post/:id').post(isAuthenticatedUser,

    createPost);
router.route('/post/:id').put(isAuthenticatedUser,updatePost);

router.route('/post/:id').delete(isAuthenticatedUser,deletePost);
router.route('/post/:id/like').put(isAuthenticatedUser,likePost);
router.route('/post/:id/unlike').put(isAuthenticatedUser,unlikePost);
router.route('/post/:id/comment').put(isAuthenticatedUser,commentPost);
router.route('/post/:id/comment/delete').delete(isAuthenticatedUser,deleteComment);
router.route('/post/:id/save').put(isAuthenticatedUser,savePost);
router.route('/post/:id/unsave').put(isAuthenticatedUser,unsavePost);
router.route('/posts/saved').get(isAuthenticatedUser,getSavedPosts);
router.route('/posts/deleteAll').delete(isAuthenticatedUser,deleteAllPosts);
router.route('/posts/explore/:tag').get(
  isAuthenticatedUser,
  explorePosts);


module.exports=router;


