const Review = require("../models/review");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const addReview = asyncHandler(async (req, res) => {
  const projectId = req.params.pid;
  const { reviewContent } = req.body;
  console.log(req.user.id);

  const reviewExists = await Review.findOne({
    project: projectId,
    user: req.user.id,
  });

  if (reviewExists) {
    throw new ApiError(400, "You have already added a review");
  }

  const review = await Review.create({
    content: reviewContent,
    project: projectId,
    user: req.user.id,
  });

  const populatedReview = await Review.findById(review._id).populate(
    "user",
    "username email _id",
  );

  return res.status(201).json({
    status: "success",
    data: populatedReview,
  });
});

const getReviews = asyncHandler(async (req, res) => {
  const projectId = req.params.pid;

  const reviews = await Review.find({ project: projectId }).populate(
    "user",
    "username profileImage _id",
  );

  return res.status(200).json({
    success: true,
    data: reviews,
  });
});

module.exports = {
  addReview,
  getReviews,
};
