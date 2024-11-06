const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, "Review cannot be empty"],
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Review must belong to a project"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user"],
    },
  },
  {
    timestamps: true,
  },
);

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
