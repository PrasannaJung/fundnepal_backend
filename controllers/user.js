const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { signupSchema, loginSchema } = require("../validators/validators");
const emailSender = require("../utils/emailSender");
const fs = require("fs");
const path = require("path");

const createUser = asyncHandler(async (req, res) => {
  const { username, phone, email, password } = req.body;

  const validatedBody = signupSchema.safeParse(req.body);
  if (!validatedBody.success) {
    throw new ApiError(400, validatedBody.error.issues[0].message);
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new ApiError(400, "User already exists");
  }
  const hashedPassword = await bcrypt.hash(password, 12);
  const newUser = new User({
    username,
    phone,
    email,
    password: hashedPassword,
  });
  await newUser.save();
  return res
    .status(201)
    .json({ success: true, message: "User created successfully" });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Please enter all fields");
  }

  const validatedBody = loginSchema.safeParse(req.body);
  if (!validatedBody.success) {
    throw new ApiError(400, validatedBody.error.issues[0].message);
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(400, "Invalid credentials. User does not exist");
  }
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw new ApiError(400, "Invalid credentials. Password did not match");
  }

  // create jwt token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  return res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
  });
});

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select(
    "-password -__v -_id -isAdmin",
  );
  return res.status(200).json({ success: true, data: user });
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const { username, phone } = req.body;
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      username: username,
      phone: phone,
    },
    { new: true }, // Return the updated document
  );

  if (!updatedUser) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json({ success: true, data: updatedUser });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email: email });
  if (!user) {
    throw new ApiError(400, "No user with such email exists!");
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "30m",
  });

  console.log("Sending email to ", email);

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Reset Password",
    html: `<h1>Reset Your Password</h1>
    <p>To change your password, follow the given link: </p>
    <a href="http://localhost:5173/reset-password/${token}">http://localhost:5173/reset-password/${token}</a>
    <p>This link will expire in 30 minutes.</p>`,
  };

  await emailSender.sendMail(mailOptions);

  return res
    .status(200)
    .json({ message: "Check your email for reset password link" });
});

const resetPassword = asyncHandler(async (req, res) => {
  const receivedToken = req.params.token;
  const { newPassword } = req.body;
  const decodedToken = jwt.verify(receivedToken, process.env.JWT_SECRET);

  // If the token is invalid, return an error
  if (!decodedToken) {
    throw new ApiError(401, "Invalid Token");
  }

  if (decodedToken.exp * 1000 < Date.now()) {
    throw new ApiError(400, "Reset link has already expired");
  }

  const user = await User.findOne({ _id: decodedToken.userId });
  if (!user) {
    throw new ApiError(401, "No user found");
  }

  const salt = await bcrypt.genSalt(10);
  const newHashedPassword = await bcrypt.hash(newPassword, salt);

  user.password = newHashedPassword;
  await user.save();

  res.status(200).send({ message: "Password updated" });
});

const uploadProfilePicture = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Check if a file is uploaded
  if (!req.files || !req.files.profileImage) {
    throw new ApiError(400, "Please upload a profile image");
  }

  const { profileImage } = req.files;

  const allowedMimeTypes = ["image/jpeg", "image/png"];
  if (!allowedMimeTypes.includes(profileImage.mimetype)) {
    throw new ApiError(400, "Invalid file type. Please upload an image");
  }

  const uploadDir = path.join(__dirname, "../public/uploads/profiles");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const imageName = `${Date.now()}-${profileImage.name}`;
  const imageUploadPath = path.join(uploadDir, imageName);

  await profileImage.mv(imageUploadPath);

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.profileImage) {
    const oldImagePath = path.join(__dirname, `../public${user.profileImage}`);
    if (fs.existsSync(oldImagePath)) {
      fs.unlinkSync(oldImagePath);
    }
  }

  user.profileImage = `/uploads/profiles/${imageName}`;
  await user.save();

  return res.status(200).json({
    success: true,
    message: "Profile image uploaded successfully",
    data: { profileImage: user.profileImage },
  });
});

module.exports = {
  createUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  forgotPassword,
  resetPassword,
  uploadProfilePicture,
};
