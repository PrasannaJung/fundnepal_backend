const router = require("express").Router();

const userController = require("../controllers/user");
const { isAuthenticated } = require("../middleware/isAuth");

router.post("/register", userController.createUser);
router.post("/login", userController.loginUser);

router.get("/profile", isAuthenticated, userController.getUserProfile);
router.post("/profile", isAuthenticated, userController.updateUserProfile);

router.post("/forgot-password", userController.forgotPassword);
router.post("/reset-password/:token", userController.resetPassword);

router.post(
  "/upload-profile-picture",
  isAuthenticated,
  userController.uploadProfilePicture,
);

module.exports = router;
