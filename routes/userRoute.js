const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  loginUser,
/*   googleAuth, */
  logoutUser,
  resetPassword,
  forgotPassword,
  uploadTicket,
  getTickets,
  updateUserPayment,
  getUserPaymentDetails,
  getSavedsByUser,
 getInteractions,
  getEventsForUser,
  getUserByToken,
  getUsersByName,
  createBussinessAccount,
  getBussinessAccounts,
  approveBussinessAccount,
  addFCM,
  sendNotification,
  rejectBussinessAccount


} = require("../controllers/userController");

const { isAuthenticatedUser,isAdmin } = require("../middlewares/authorize");
const upload = multer({ dest: 'uploads/' })
router.route("/getAllUsers").get(isAuthenticatedUser,isAdmin,   getUsers);
router.route("/getUser/:id").get(isAuthenticatedUser,isAdmin ,getUser);
router.route("/signup").post(createUser);
router.route("/updateUser/:id").put(isAuthenticatedUser,updateUser);
router.route("/deleteUser/:id").delete(deleteUser);
router.route("/login").post(loginUser);
/* router.route("/googleauth").post(googleAuth); */
router.route("/logout").post(isAuthenticatedUser, logoutUser);
router.route("/requestPasswordReset").post(forgotPassword);
router.route("/passwordreset").post(resetPassword);
router.route("/uploadTicket").post(isAuthenticatedUser,
  upload.array('images'),
  uploadTicket);
router.route("/getTickets").get(isAuthenticatedUser,getTickets);
router.route("/updateUserPayment").put(isAuthenticatedUser,updateUserPayment);
router.route("/getUserPaymentDetails").get(isAuthenticatedUser,getUserPaymentDetails);
router.route("/getSavedsByUser").get(isAuthenticatedUser,getSavedsByUser);
router.route("/getInteractions").get(isAuthenticatedUser,getInteractions);
router.route("/getEventsForUser").get(isAuthenticatedUser,getEventsForUser);
router.route("/getUserByToken").get(isAuthenticatedUser,getUserByToken);
router.route("/getUsersByName").get(isAuthenticatedUser,getUsersByName);
router.route("/createBussinessAccount").post(createBussinessAccount);
router.route("/getBussinessAccounts").get(isAuthenticatedUser
  ,isAdmin
  ,getBussinessAccounts);
router.route("/approveBussinessAccount/:id").put(isAuthenticatedUser
  ,isAdmin
  ,approveBussinessAccount);
router.route("/addFcmToken").put(isAuthenticatedUser,addFCM);
router.route("/sendNotification").post(isAuthenticatedUser,sendNotification);
router.route("/rejectBussinessAccount/:id").put(isAuthenticatedUser,isAdmin,rejectBussinessAccount);



module.exports = router;
