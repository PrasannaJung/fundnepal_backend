const mongoose = require("mongoose");
const User = require("../models/user");
const Investor = require("../models/investor");
const emailSender = require("../utils/emailSender");

const projectSchema = new mongoose.Schema(
  {
    projectTitle: {
      type: String,
      required: true,
    },
    projectDescription: {
      type: String,
      required: true,
    },
    projectImage: {
      type: String,
      required: true,
    },
    projectGoal: {
      type: Number,
      required: true,
    },
    projectDeadline: {
      type: Date,
      required: true,
    },
    projectCategory: {
      type: String,
      required: true,
      enum: [
        "Art",
        "Fashion",
        "Technology",
        "Others",
        "Music",
        "Games",
        "Food",
      ],
    },
    projectStart: {
      type: Date,
      default: Date.now,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    investedAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "failed", "completed"],
      default: "active",
    },
  },
  { timestamps: true },
);

projectSchema.pre("save", async function (next) {
  const currentProject = this;
  if (currentProject.investedAmount >= currentProject.projectGoal) {
    currentProject.status = "completed";
    const author = await User.findById(currentProject.createdBy);
    const investors = await Investor.find({ projectId: this._id });
    const investorAsUsers = await User.find({
      _id: { $in: investors.map((investor) => investor.investorId) },
    });
    const investorEmails = investorAsUsers.map((investor) => investor.email);

    const mailOptions = {
      from: process.env.EMAIL,
      to: investorEmails.concat(author.email),
      subject: "Project Completed",
      text: `Congratulations! Your project ${this.projectTitle} has been successfully completed.`,
    };

    emailSender.sendMail(mailOptions, (e, info) => {
      if (e) {
        console.log(e);
      } else {
        console.log("email has been sent", info.response);
      }
    });
  }

  next();
});

const Project = mongoose.model("Project", projectSchema);
module.exports = Project;
