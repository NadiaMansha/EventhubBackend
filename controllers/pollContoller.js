const Poll=require('../models/Poll');
const User=require('../models/User');
const Community=require('../models/Community');
const Comment=require('../models/Comment')
const Saved=require('../models/Saved')


//@desc create a poll
//@route POST api/posts
//@access Private
const createPoll = async (req, res) => {
    const { postType, title, description, expiryDate, options,tags } = req.body;
    const creator=req.user?._id;
      try {
        const newPoll = await Poll.create({
          postType,
          title,
          description,
          expiryDate,
          options,
          creator,
          community: req.params.id,
        });
        if(tags){
          const tagsArray = tags?.map((tag) => tag.trim());
          newPoll.tags = tagsArray;
      }
      await newPoll.save();
      
        const community = await Community.findById(req.params.id);
        community.polls.push(newPoll?._id);
        await community.save();
        res.json({
          success: true,
          post: newPoll,
          message: "Poll created successfully",
        });
      } catch (error) {
        res.status(500).json({
          success: "false",
          message: "Server Error",
          error: error.message,
        });
      }
    }

    //@desc update a poll
//@route PUT api/posts/:id
//@access Private
const updatePoll = async (req, res) => {
    const { postType, title, description, expiryDate, options,tags } = req.body;
    const creator=req.user?._id;

    try {
      const poll = await Poll.findById(req.params.id);
      if (!poll) {
        return res.status(404).json({ success: false, message: "Poll not found" });
      }
      if (poll.user.toString() !== req.user._id.toString()) {
        return res.status(401).json({
          success: false,
          message: "You are not authorized to update this poll",
        });
      }
      poll.postType = postType;
      poll.title = title;
      poll.description = description;
      poll.expiryDate = expiryDate;
      poll.options = options;
      poll.creator = creator;
      poll.community = req.params.id;
      
        if(tags){
          const tagsArray = tags?.map((tag) => tag.trim());
          poll.tags = tagsArray;
      }
      await poll.save();
        
        
    

      await poll.save();
      res.json({
        success: true,
        poll: poll,
        message: "Poll updated successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: "false",
        message: "Server Error",
        error: error.message,
      });
    }
  };


    //@desc get a poll by id
//@route GET api/posts/:id
//@access Public
const getPoll = async (req, res) => {
    try {
      const poll = await Poll.findById(req.params.id);
      if (!poll) {
        return res.status(404).json({ success: false, message: "Poll not found" });
      }
      res.json({
        success: true,
        poll: poll,
        message: "Poll fetched successfully",
      });
    } catch (error) {
    
      if (error.kind === "ObjectId") {
        return res.status(404).json({ success: false,
          error: error.message,
           message: "Poll not found" });
      }
      res.status(500).send({ success: false,
        error: error.message,
         message: "Server Error" });
    }
  };

  
  //@desc delete poll by id
//@route DELETE api/posts/:id
//@access Private
const deletePoll = async (req, res) => {
    try {
      const poll = await Poll.findById(req.params.id);
      if (!poll) {
        return res
          .status(404)
          .json({ success: false, message: "Poll not found" });
      }
      if (poll.user.toString() !== req.user._id) {
        return res
          .status(401)
          .json({ success: false, message: "User not authorized" });
      }
      await Poll.findByIdAndRemove(req.params.id);
      res.json({ success: true, message: "Poll deleted successfully" });
    } catch (error) {
      console.error(error.message);
      if (error.kind === "ObjectId") {
        return res
          .status(404)
          .json({ success: false,
            error: error.message,
             message: "Poll not found" });
      }
      res.status(500).send({ success: false,
        error: error.message,
         message: "Server Error" });
    }
  };

//@desc like a poll
//@route PUT api/posts/like/:id
//@access Private
const likePoll = async (req, res) => {
    try {
        const poll = await Poll.findById(req.params.id);
        if (poll.likes.some((like) => like?.toString() === req.user._id)) {
            return res.status(400).json({ success: false,
                message: "Poll already liked" });
        }
        poll.likes.push({
            user: req.user._id,
            poll: req.params.id
        });
        
        await poll.save();
        res.json({ success: true,
            poll: poll,
                message: "Poll liked successfully" });
        } catch (error) {
       
        res.status(500).send({ success: false,
            error: error.message,
             message: "Server Error" });
        }
    };

//@desc unlike a poll
//@route PUT api/posts/unlike/:id
//@access Private
const unlikePoll = async (req, res) => {
    try {
        const poll = await Poll.findById(req.params.id);
        if (!poll.likes.some((like) => like?.toString() === req.user._id)) {
            return res.status(400).json({ success: false,
                message: "Poll has not yet been liked" });
        }

        const removeIndex = poll.likes.findIndex(
            (like) => like?.toString() === req.user._id
        );
        poll.likes.splice(removeIndex, 1);
        await poll.save();
        res.json({ success: true,
            poll: poll,
                message: "Poll unliked successfully" });
        } catch (error) {
                res.status(500).send({ success: false,
                    error: error.message,
                        message: "Server Error" });
        }
    };

//@desc comment on a poll
//@route POST api/posts/comment/:id
//@access Private
const commentOnPoll = async (req, res) => {
    try {
        const poll=await Poll.findById(req.params.id);
        const user=req.user._id;
        const {text}=req.body;
        const newComment=new Comment({
            text,
            user,
            poll:poll._id,
        });
        await newComment.save();
        poll.comments.push(newComment._id);
        await poll.save();
        const savedPoll=await Poll.findById(req.params.id).populate('comments')
        .populate('likes').populate({
            path: 'comments',
            populate: {
              path: 'user',
              model: 'User',
            },
        });
        res.json({ success: true,
            poll: poll,
                message: "Commented on poll successfully" });
        } catch (error) {
                res.status(500).send({ success: false,
                    error: error.message,
                        message: "Server Error" });
        }
    };

//@desc delete comment on a poll
//@route DELETE api/posts/comment/:id/:comment_id
//@access Private
const deleteCommentOnPoll = async (req, res) => {
    try {
        const poll=await Poll.findById(req.params.id);

        const comment=await Comment.findById(req.params.comment_id);
        if(!comment){
            return res.status(404).json({ success: false, message: "Comment not found" });
        }
          
        
    
         const user=req.user._id;
         const commentUser=comment.user;
          if(commentUser?.toString()!==user?.toString()){
            return res.status(401).json({ success: false, message: "User not authorized" });
          }

      
        const removeIndex=poll.comments.findIndex((comment)=>comment?.toString()===req.params.comment_id);
        poll.comments.splice(removeIndex,1);
        await poll.save();
        await Comment.findByIdAndRemove(req.params.comment_id);
        res.json({ success: true,
            poll: poll,
                message: "Comment deleted successfully" });
        } catch (error) {
                res.status(500).send({ success: false,
                    error: error.message,
                        message: "Server Error" });
        }
    };

    //@desc save a poll
//@route PUT api/posts/save/:id
//@access Private
const savePoll = async (req, res) => {
    try {
        const poll = await Poll.findById(req.params.id);
        const saved= await Saved.create({
            poll: poll._id,
            user: req.user._id,
        });
        
        res.json({ success: true,
            poll: poll,
                message: "Poll saved successfully" });
        } catch (error) {
                res.status(500).send({ success: false,
                    error: error.message,
                        message: "Server Error" });
        }
    };

//@desc unsave a poll
//@route PUT api/posts/unsave/:id
//@access Private
const unsavePoll = async (req, res) => {
    try {
        const poll = await Poll.findById(req.params.id);
        const saved= await Saved.find({user: req.user._id,poll: poll._id});
        if(!saved){
            return res.status(404).json({ success: false, message: "Poll not found" });
        }
        await Saved.findByIdAndRemove(Saved._id);
        res.json({ success: true,
            poll: poll,
                message: "Poll unsaved successfully" });
        } catch (error) {
                res.status(500).send({ success: false,
                    error: error.message,
                        message: "Server Error" });
        }
    };

//@desc get all saved polls for user
//@route GET api/posts/saved
//@access Private
const getSavedPolls = async (req, res) => {
    try {
        const Saved= await Saved.find({user: req.user._id});
        res.json({ success: true,
            polls: Saved,
                message: "Polls fetched successfully" });
        } catch (error) {
                res.status(500).send({ success: false,
                    error: error.message,
                        message: "Server Error" });
        }
    }

  //@desc like an option in a poll
//@route PUT api/posts/like/:id/:option
//@access Private
const likePollOption = async (req, res) => {
    try {
      const poll = await Poll.findById(req.params.id);
      const option = req.body.option;
     const options=  poll.options;
     console.log(options);
      const optionObject = options.find((option) => option._id.toString() === req.body.option);
      console.log(optionObject);
      const user = req.user._id;
      optionObject.count=optionObject.count+1;
      poll.votes.push({
        user,
        option,
      });
      await poll.save();
      res.json({ success: true,
        poll: poll,
        option: optionObject,
         message: "Poll  option liked successfully" });
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ success: false, message: "Server Error" });
    }
  };
  
  module.exports = {
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
    };
    
