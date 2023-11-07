const Feedback=require('../models/Feedback');
const User=require('../models/User');
const { uploadOnAws } = require("../s3");
//@desc    Get all feedbacks
//@route   GET /api/v1/feedbacks
//@access  Private
const getFeedbacks=async(req,res)=>{
    try {
        const feedbacks=await Feedback.find({type:'feedback'}).sort({created_at:-1});
        return res.status(200).json({
            success:true,
            count:feedbacks.length,
            data:feedbacks
        });
    } catch (error) {
        return res.status(500).json({
            success:false,
            error:'Server Error'
        });
    }
}
//@desc   Get all reports
//@route   GET /api/v1/reports
//@access  Private
const getReports=async(req,res)=>{
    try {
        const reports=await Feedback.find({type:'report'}).sort({created_at:-1});
        return res.status(200).json({
            success:true,
            count:reports.length,
            data:reports
        });
    } catch (error) {
        return res.status(500).json({
            success:false,
            error:'Server Error'
        });
    }
}

//@desc create feedback
//@route POST /api/v1/feedbacks
//@access Private
const createFeedback=async(req,res)=>{
    try {
        const {type,category,feedback,report,profileType,profile,email}=req.body;
        
        let file;
        let isAttatchment=false;
        if(req.file){
            file=await uploadOnAws(req.file);
            isAttatchment=true;
        }

        
        

        const newFeedback= await Feedback.create({
            type,
            profileType,
            profile,
            email,
            category,
            feedback,
            report,
            file,
            isAttatchment
        });
        return res.status(201).json({
            success:true,
            data:newFeedback
        });

       
    } catch (error) {
        return res.status(500).json({
            success:false,
        error:error.message||'Server Error',
           message:'Server Error'
        });
    }
}


//@ desc get a feedback
//@route GET /api/v1/feedbacks/:id
//@access Private
const getFeedback=async(req,res)=>{
    try {
        const feedback=await Feedback.findById(req.params.id);
        if(!feedback){
            return res.status(404).json({
                success:false,
                error:'Feedback not found'
            });
        }
        return res.status(200).json({
            success:true,
            data:feedback
        });
    } catch (error) {
        return res.status(500).json({
            success:false,
            error:'Server Error'
        });
    }
}

module.exports={
    getFeedbacks,
    getReports,
    createFeedback,
    getFeedback
}