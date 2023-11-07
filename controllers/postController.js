const Post = require("../models/Post");
const Community = require("../models/Community");
const User = require("../models/User");
const Comment = require("../models/Comment");
const Saved = require("../models/Saved");
const Poll = require("../models/Poll");
const { uploadOnAws } = require("../s3");
const Event=require('../models/Event');
const Place=require('../models/Place');

//@desc create a post
//@route POST api/posts
//@access Private
const createPost = async (req, res) => {
const { postType } = req.body;
    const { title, body, tags } = req.body;
    const file = await uploadOnAws(req.file);
    try{
      const newPost = await Post.create({
        postType,
        title,
        body,
        file,
        user: req.user._id,
        community: req.params.id,
      });
      if(tags){
        newPost.tags=tags;
      }
    await newPost.save();
      const community = await Community.findById(req.params.id);
      community.posts.push(newPost._id);
      await community.save();
        res.json({
        success: true,
        post: newPost,
        message: "Post created successfully",
      });

    } catch (error) {
        res.status(500).json({
        success: "false",
        message: "Server Error",
        error: error.message,
        });
  }
};



//@desc get all posts
//@route GET api/posts
//@access Public
const getPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
   
    posts.forEach(async (post) => {
      const likes = post.likes;
      const isLiked = likes.some(like => like.user.toString() === req.user?._id.toString())?true:false;
      post.isLiked = isLiked;
      
      const saved = await Saved.findOne({user:req.user?._id , post:post._id});
      console.log(saved);
      const BookMarked = saved?true:false;
      post.isBookmarked = BookMarked;
      await post.save();
     
      
    }); 
  

    

    const polls = await Poll.find().sort({ date: -1 });
    polls.forEach(async (poll) => {
      const likes = poll.likes;
      const isLiked = likes.some(like => like.user.toString() === req.user?._id.toString())?true:false;
      poll.isLiked = isLiked;
    
      await poll.save();
     
      
    }); 
    res.json({
      success: true,
      posts: 
      posts,
      polls: polls,
      message: "Posts fetched successfully",
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ success: false, message: "Server Error" });
  }
};

//@desc get post by id
//@route GET api/posts/:id
//@access Public
const getPost = async (req, res) => {
  try {
    
    const post = await Post.findById(req.params.id).populate("user").populate("comments").populate(
      {
        path: "comments",
        populate: {
          path: "user",
          model: "User",
        },
      }
    );

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    } 
       const likes= post.likes;
        const saved= await Saved.findOne({user:req.user?._id , post:req.params.id});
        const isBookMarked=saved?true:false;

    
        const isLiked=likes?.includes(req.user?._id)?true:false;
        post.isLiked=isLiked;
        post.isBookmarked=isBookMarked;
        await post.save();
      res.json({
        success: true,
        post: post,
  
        message: "Post fetched successfully",
      });
  } catch (error) {
    console.error(error.message);
    if (error.kind === "ObjectId") {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }
    res.status(500).send({ success: false, message: "Server Error" });
  }
};




//@desc delete post by id
//@route DELETE api/posts/:id
//@access Private
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }
    if (post.user.toString() !== req.user._id) {
      return res
        .status(401)
        .json({ success: false, message: "User not authorized" });
    }
    await Post.findByIdAndRemove(req.params.id);
    res.json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.error(error.message);
    if (error.kind === "ObjectId") {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }
    res.status(500).send({ success: false, message: "Server Error" });
  }
};





//@desc like a post
//@route PUT api/posts/like/:id
//@access Private
const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const likes = post?.likes;
    
    const isLiked = likes?.some(like => like.user.toString() === req.user?._id.toString());
    if(isLiked){
      return res.status(400).json({ success: false, message: "Post already liked" });
    }
    likes?.push({ user: req.user._id ,
    post: req.params.id});
    await post.save();
    res.json({ success: true, post: post, message: "Post liked successfully" });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, error: error.message, message: "Server Error" });
  }
};

//@desc unlike a post
//@route PUT api/posts/unlike/:id
//@access Private
const unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const likes = post.likes;
    const isLiked = likes.some(like => like.user.toString() === req.user?._id.toString())?true:false;
    if(!isLiked){
      return res.status(400).json({ success: false, message: "Post has not yet been liked" });
    }

    post.isLiked=false;

    const removeIndex = likes
      .map((like) => like.user.toString())
      .indexOf(req.user._id);
    likes.splice(removeIndex, 1);
    await post.save();
    res.json({
      success: true,
      post: post,
      message: "Post unliked successfully",
    });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, error: error.message, message: "Server Error" });
  }
};

//@desc comment on a post
//@route POST api/posts/comment/:id
//@access Private
const commentPost = async (req, res) => {
  const { text } = req.body;
  try {
    const user = await User.findById(req.user._id).select("-password");
    const post = await Post.findById(req.params.id);
    const newComment = new Comment({
      text,
      user: req.user._id,
      post: req.params.id,

    });
    await newComment.save();
    post.comments.unshift(newComment._id);
    await post.save();
    const savedPost = await Post.findById(req.params.id).populate("comments").populate("user").populate("comments").populate(
      {
        path: "comments",
        populate: {
          path: "user",
          model: "User",
        },
      }
    );
    res.json({
      success: true,
      post: savedPost,
     
    
     
      message: "Comment added successfully",
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ success: false, message: "Server Error" });
  }
};

//@desc delete comment on a post
//@route DELETE api/posts/comment/:id/:comment_id
//@access Private
const deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
     const comments = post.comments;
    const comment = await Comment.findById(req.body.comment_id);


    if (!comment) {
      return res
        .status(404)
        .json({ success: false, message: "Comment does not exist" });
    }
    const commentuser = comment.user?.toString();
    const user = req.user._id.toString();

    if (commentuser !== user) {
      return res
        .status(401)
        .json({ success: false, message: "User not authorized" });
    }

    const removeIndex = post.comments
      .map((comment) => comment?.toString())
      .indexOf(req.user._id);
    post.comments.splice(removeIndex, 1);
    await post.save();
    res.json({
      success: true,
      comments: comments,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ success: false, message: "Server Error" });
  }
};

//@desc save post
//@route PUT api/posts/save/:id
//@access Private
const savePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const savedPost = await Saved.findOne({
      user: req.user._id,
      post: req.params.id,
    });
    if (savedPost) {
      return res
        .status(400)
        .json({ success: false, message: "Post already saved" });
    }
    const newSavedPost = new Saved({
      user: req.user._id,
      post: req.params.id,
    });
    await newSavedPost.save();
    res.json({ success: true, message: "Post saved successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ success: false, message: "Server Error" });
  }
};

//@desc unsave post
//@route PUT api/posts/unsave/:id
//@access Private
const unsavePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const savedPost = await Saved.findOne({
      user: req.user._id,
      post: req.params.id,
    });
    if (!savedPost) {
      return res
        .status(400)
        .json({ success: false, message: "Post has not been saved" });
    }
    await Saved.findOneAndRemove({ user: req.user._id, post: req.params.id });
    post,isBookmarked=false;
    await post.save();
    res.json({ success: true, message: "Post unsaved successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ success: false, message: "Server Error" });
  }
};

//@desc get saved posts for user
//@route GET api/posts/saved
//@access Private
const getSavedPosts = async (req, res) => {
  try {
    const savedPosts = await Saved.find({ user: req.user._id }).populate(
      "post",
      "text name avatar"
    );
    res.json({
      success: true,
      savedPosts: savedPosts,
      message: "Saved posts fetched successfully",
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ success: false, message: "Server Error" });
  }
};

//@desc delete all posts
//@route DELETE api/posts
//@access Private
const deleteAllPosts = async (req, res) => {
  try {
    await Post.deleteMany();
    res.json({ success: true, message: "All posts deleted successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ success: false, message: "Server Error" });
  }
};

//@desc update post
//@route PUT api/posts/:id
//@access Private
const updatePost = async (req, res) => {
  const { text, body ,tags} = req.body;
  const file = await uploadOnAws(req.file);
  const postFields = {};
  if (text) postFields.text = text;
  if (body) postFields.body = body;
  if (file) postFields.file = file;
  if (tags) postFields.tags = tags;

  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }
    const user = req.user._id.toString();
    const postuser = post.user.toString();
    if (user !== postuser) {
      return res
        .status(401)
        .json({ success: false, message: "User not authorized" });
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { $set: postFields },
      { new: true }
    );
    res.json({
      success: true,
      post: updatedPost,
      message: "Post updated successfully",
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ success: false, message: "Server Error" });
  }
};


//@desc explore posts on basis of tags
//@route GET api/posts/explore/:tag
//@access Private
const explorePosts = async (req, res) => {
  try {

    const tagRegex = new RegExp(req.params.tag, 'i'); // create a case-insensitive regex for the tag search

    const posts = await Post.find({ tags: tagRegex })
      .populate("user")
      .populate("comments")
      .populate("likes");
    
    const polls = await Poll.find({ tags: tagRegex })
      .populate("creator")
      .populate("comments")
      .populate("likes");
    
    const communities = await Community.find({ tags: tagRegex })
      .populate("members");
    
    const events = await Event.find({ tags: tagRegex })
      .populate("Organiser")
      .populate("comments")
      .populate("likes");
    events.forEach((event) => {
      const isMember = event.users.includes(req.user._id);
      event.isJoined = isMember? true : false;
    });
    const places = await Place.find({ tags: tagRegex })
      .populate("creator");
    
    const combined = [...posts, ...polls, ...communities, ...events, ...places];
    
     
    res.status(200).json({
      success: true,
    data: combined,
      message: "explore data fetched successfully",
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ success: false, message: "Server Error" });
  }
};


//@desc share a post using deep link
//@route GET api/posts/share/:id
//@access Private
const sharePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }
  
    const shareLink = `http://localhost:5000/sharepost/${post._id}`;
    res.json({
      success: true,
      deepLink:shareLink,
      message: "Post shared successfully",
    });
  }
  catch (error) {
   
    res.status(500).send({ success: false,
      error: error.message,
       message: "Server Error" });
  }
};



 

module.exports = {
  getPosts,
  getPost,
  createPost,
  deletePost,
  likePost,
  unlikePost,
  commentPost,
  deleteComment,
  savePost,
  unsavePost,
  getSavedPosts,
  deleteAllPosts,
  updatePost,
  explorePosts,
  sharePost,
 
};
