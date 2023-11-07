const Community=require('../models/Community');
const User=require('../models/User');
const Post=require('../models/Post');
const Comment=require('../models/Comment');
const Saved=require('../models/Saved');
const { uploadOnAws } = require('../s3');



 


// @route   GET api/communities
// @desc    Get all communities
// @access  Public
const getCommunities=async (req,res)=>{
    try {
        const popularCommunities=await Community.find().sort({members:-1});
        const communitiesForYou=await Community.find().sort({createdAt:-1});
        if(communitiesForYou.length===0 && popularCommunities.length===0){
            return res.status(404).json({
                success:false,
                message:'No communities found'});
        }
        const communities={popularCommunities,communitiesForYou};
        res.json(
            {success:true,
            communities:communities,
            message:'Communities fetched successfully'});
        
    } catch (error) {
        console.error(error.message);
        res.status(500).send(
            {success:false,
            message:'Server Error'});
    
    }
}

//@desc get all communities for admin
const getAllCommunities=async (req,res)=>{
    try {
        const communities=await Community.find();
        if(communities.length===0){
            return res.status(404).json({
                success:false,
                message:'No communities found'});
        }
        res.json(
            {success:true,
            communities:communities,
            message:'Communities fetched successfully'});
            }
    catch (error) {
   res.status(500).send(
            {success:false,
                error:error.message,
            message:'Server Error'});
    }
}




// @route   GET api/communities/:id
// @desc    Get community by ID
// @access  Public
const getCommunity=async (req,res)=>{
    try {
        const userTd=req.body.id
        console.log(userTd);
       const member=await Community.findOne({_id:req.params.id,members:userTd});
         const isMember=member?true:false;
       
         const commmunityPosts=await Post.find({community:req.params.id});
         commmunityPosts.forEach(async (post)=>{
            const likes = post.likes;
            const isLiked = likes.some(like => like.user.toString() === userTd.toString())?true:false;
            post.isLiked = isLiked;
            const saved = await Saved.findOne({user:userTd , post:post._id});
            
            const isBookMarked = saved?true:false;
            post.isBookmarked = isBookMarked;
            await post.save();
        
            })
           



        const communityData=await Community.findById(req.params.id).populate('posts').populate(
            {
                path: 'posts',
                populate: { path: 'user' }
            }
        )
        .populate({
            path: 'posts',
            populate: { path: 'comments' }
        })
        .populate('members')
        .populate('polls')
        if(!communityData){
            return res.status(404).json({
                success:false,
                message:'Community not found'});
        }
        res.json(
            {success:true,
            community:communityData,
            isMember:isMember,
            message:'Community fetched successfully'}
                
        );
    } catch (error) {

    
        if(error.kind==='ObjectId'){
            return res.status(404).json( 
                {success:false,

                message:'Community not found'});
        }
        res.status(500).send(
            {success:false,
                error:error.message,
            message:'Server Error'});
            
    }
}

// @route   POST api/communities
// @desc    Create a community
// @access  Private
const createCommunity=async (req,res)=>{
    try{
    const {name,description,tags}=req.body;
    console.log(req.body)
    console.log(req.files)
    
     const images=[];
     for(let file of req.files){
         const name= await uploadOnAws(file);
            images.push(name);
     }

   

    
        const community=new Community({
            name,
            description,
            images
        });
        await community.save();
       
            if(tags){
                community.tags=tags;    
            }
            await community.save()
          


        

      
      
        res.json(
            {success:true,
            community:community,
            message:'Community created successfully'});
        
    } catch (error) {
       
        res.status(500).send(
            {success:false,
                error:error.message,
            message:'Server Error'});
    
    }
}


// @route   PUT api/communities/:id
// @desc    Update a community
// @access  Private
const updateCommunity=async (req,res)=>{
    const {name,description,tags}=req.body;
   
    
    const communityFields={};
    if(name) communityFields.name=name;
    if(description) communityFields.description=description;
  
    if(tags){
        communityFields.tags=tags;
    }
   if(req.files){
    const images=[];
    for(let file of req.files){
        const name= await uploadOnAws(file);
              images.push(name);
    }
    communityFields.images=images;
    }
    
    
    try {
        let community=await Community.findById(req.params.id);
        if(!community){
            return res.status(404).json({
                success:false,
                message:'Community not found'});
        }
        community=await Community.findByIdAndUpdate(req.params.id,
            {$set:communityFields},
            {new:true});
        res.json(
            {success:true,
            community:community,
            message:'Community updated successfully'});
        
    } catch (error) {
        console.error(error.message);
        res.status(500).send(
            {success:false,
            message:'Server Error'});
    
    }
}



// @route   DELETE api/communities/:id
// @desc    Delete a community
// @access  Private
const deleteCommunity=async (req,res)=>{
    try {
        let community=await Community.findById(req.params.id);
        if(!community){
            return res.status(404).json({
                success:false,
                message:'Community not found'});
        }
        await Post.deleteMany({community:req.params.id});
        await Community.findByIdAndRemove(req.params.id);
        res.json(
            {success:true,
            message:'Community deleted successfully'});
        
    } catch (error) {
        console.error(error.message);
        res.status(500).send(
            {success:false,
            message:'Server Error'});
    
    }
}

// @route   PUT api/communities/join/:id
// @desc    Join a community
// @access  Private
const joinCommunity=async (req,res)=>{
    try {
        const community=await Community.findById(req.params.id);
        const user=await User.findById(req.user._id);
       if(community.members?.includes(req.user._id)){
            return res.status(400).json({
                success:false,
                message:'You are already a member of this community'});
        }
        community.members?.push(req.user._id);
        await community.save();
        user.communities?.push(req.params.id);
        await user.save();

        res.json(
            {success:true,
            community:community,
            user:user,
            message:'Community joined successfully'});
        
    } catch (error) {
        console.error(error.message);
        res.status(500).send(
            {success:false,
            message:'Server Error'});
    
    }
}

// @route   PUT api/communities/leave/:id
// @desc    Leave a community
// @access  Private
const leaveCommunity=async (req,res)=>{
    try {
        const community=await Community.findById(req.params.id);
        const member=community.members?.filter(member=>member===req.user._id);
        const user=await User.findById(req.user._id);
        if(!member){
            return res.status(400).json({
                success:false,
                message:'You are not a member of this community'});
        }

         const userIndex= user.communities?.map(community=>community?.toString()).indexOf(req.params.id);
        const removeIndex=community.members?.map(member=>member?.toString()).indexOf(req.user._id);
        community.members.splice(removeIndex,1);
        await community.save();
        user.communities?.splice(userIndex,1);
        res.json(
            {success:true,
            community:community,
            user:user,
            message:'Community left successfully'});
        
    } catch (error) {
        console.error(error.message);
        res.status(500).send(
            {success:false,
            message:'Server Error'});
    
    }
}

//@DESC Search posts in a community
//@ROUTE GET /api/communities/:id/search
//@ACCESS Private
const searchCommunityPosts=async (req,res)=>{
    try {
        const community=await Community.findById(req.params.id);
        if(!community){
            return res.status(404).json({
                success:false,
                message:'Community not found'});
        }
        const posts=await Post.find({community:req.params.id}).populate('user',['name','avatar']).sort({date:-1});
        const searchResults=posts.filter(post=>post.title.toLowerCase().includes(req.query.qurey)) || posts.filter(post=>post.text.toLowerCase().includes(req.query.qurey));
        res.json(searchResults);
    } catch (error) {
        console.error(error.message);
        res.status(500).send(
            {success:false,
            message:'Server Error'});
    }
}

//@desc delete all communities
//@route DELETE /api/communities
//@access Private
const deleteAllCommunities=async (req,res)=>{
    try {
        await Community.deleteMany();
        res.json(
            {success:true,
            message:'All communities deleted successfully'});
    } catch (error) {
        console.error(error.message);
        res.status(500).send(
            {success:false,
            message:'Server Error'});
    }
}










module.exports={
    getCommunities,
    getCommunity,
    createCommunity,
    updateCommunity,
    deleteCommunity,
    joinCommunity,
    leaveCommunity,
    searchCommunityPosts,
    deleteAllCommunities,
    getAllCommunities
}

