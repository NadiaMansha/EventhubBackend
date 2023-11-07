require("dotenv").config();
const jsonwebtoken = require("jsonwebtoken");
const User = require("../models/User");

const isAuthenticatedUser = async (req, res, next) => {
  const authorization = req.headers.authorization;
  const token = authorization && authorization.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, error: "no token found" });
  }
  try {
       const decoded = await jsonwebtoken.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id)
      .select("-password")
      .lean()
      .exec();
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found"});
       }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Unauthorized user" });
  }
};

//check if user is an admin
const isAdmin = async (req, res, next) => {
  if (req.user.role !== "admin") {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized access" });
  }
  next();
};



module.exports = {
  isAuthenticatedUser,
  isAdmin,
};
