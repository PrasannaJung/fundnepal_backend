const Project = require("../models/project");
const path = require("path");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const mongoose = require("mongoose");
const Investor = require("../models/investor");
const Bookmark = require("../models/bookmark");
const Review = require("../models/review");
const fs = require("fs");

const createProject = asyncHandler(async (req, res) => {
  const {
    projectTitle,
    projectDescription,
    projectGoal,
    projectDeadline,
    projectCategory,
  } = req.body;

  console.log("Body is", req.body);
  console.log("Files is", req.files);

  if (
    !projectTitle ||
    !projectDescription ||
    !projectGoal ||
    !projectDeadline ||
    !projectCategory
  ) {
    throw new ApiError(400, "Please fill in all fields");
  }

  if (!req.files || !req.files.projectImage) {
    throw new ApiError(400, "Please upload an image");
  }

  const { projectImage } = req.files;

  const imageName = `${Date.now()}${projectImage.name}`;

  const imageUploadPath = path.join(
    __dirname,
    `../public/uploads/${imageName}`,
  );

  await projectImage.mv(imageUploadPath);

  const project = new Project({
    projectTitle,
    projectDescription,
    projectGoal,
    projectDeadline,
    projectCategory,
    projectImage: "/uploads/" + imageName,
    createdBy: req.user.id,
  });
  const newProject = await project.save();
  return res.status(201).json({
    success: true,
    message: "Project created successfully",
    data: newProject,
  });
});

const getAllProjects = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 4;
  const skip = (page - 1) * limit;
  const search = req.query.search || "";
  const categories = req.query.categories
    ? req.query.categories.split(",")
    : [];
  const funding = req.query.funding ? req.query.funding.split("P") : [];
  console.log("Incoming query array is ", funding);

  let query = {};

  if (search) {
    const searchTerms = search.split(" ").map((term) => ({
      projectTitle: { $regex: term, $options: "i" },
    }));
    query.$and = searchTerms;
  }

  if (categories.length > 0) {
    query.projectCategory = { $in: categories };
  }

  if (funding.length > 0) {
    const fundingQuery = funding.map((range) => {
      switch (range) {
        case "1,000 - 5,000":
          return { projectGoal: { $gte: 1000, $lte: 5000 } };
        case "5,000 - 10,000":
          return { projectGoal: { $gt: 5000, $lte: 10000 } };
        case "More than 10,000":
          return { projectGoal: { $gt: 10000 } };
        default:
          return {};
      }
    });
    console.log("FUnding query is :", fundingQuery);
    if (fundingQuery.length > 0) {
      query.$and = query.$and || [];
      query.$and.push({ $or: fundingQuery });
    }
  }

  const projects = await Project.find(query)
    .skip(skip)
    .limit(limit)
    .select("-__v -createdAt -updatedAt")
    .populate("createdBy", "username -_id");

  const totalProjects = await Project.countDocuments(query);
  const totalPages = Math.ceil(totalProjects / limit);

  return res.status(200).json({
    success: true,
    data: projects,
    currentPage: page,
    totalPages: totalPages,
    totalProjects: totalProjects,
  });
});

const getOneProject = asyncHandler(async (req, res) => {
  const projectId = req.params.id;
  const project = await Project.findById(projectId)
    .populate("createdBy", "username -_id")
    .select("-__v -createdAt -updatedAt");
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const investors = await Investor.find({ projectId: project._id })
    .populate("investorId", "-password -email -phone -isAdmin -__v -_id")
    .select("-_id -__v");

  const reviewsCount = await Review.countDocuments({ project: project._id });

  return res
    .status(200)
    .json({ success: true, data: { project, investors, reviewsCount } });
});

// const searchProject = asyncHandler(async (req, res) => {
//   const search = req.query.query;
//   const category = req.query.category;
//   const projects = await Project.find({
//     projectTitle: { $regex: search, $options: "i" },
//     projectCategory: { $regex: category, $options: "i" },
//   });
//   return res.status(200).json({ success: true, data: projects });
// });

const getMyProjects = asyncHandler(async (req, res) => {
  const userId = req.userId;
  console.log("User id is", userId);
  const projects = await Project.find({ createdBy: userId });
  return res.status(200).json({ success: true, data: projects });
});

const createBookmark = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const projectId = req.params.pid;
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(400, "No project found");
  }

  const bookmark = await Bookmark.find({ userId, projectId });

  console.log("Bookmark is ", bookmark.length);
  if (bookmark.length > 0) {
    throw new ApiError(400, "Project is alreayd bookmarked");
  }

  const newBookmark = new Bookmark({ userId, projectId });
  await newBookmark.save();
  return res
    .status(201)
    .json({ message: "Successfully bookmarked the project" });
});

const getAllBookmarks = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const bookmarks = await Bookmark.find({ userId: userId })
    .populate("projectId")
    .select("projectId -_id");
  return res.status(200).json({ data: bookmarks });
});

const updateProject = asyncHandler(async (req, res) => {
  const projectId = req.params.id;
  const userId = req.user.id;

  const {
    projectTitle,
    projectDescription,
    projectGoal,
    projectDeadline,
    projectCategory,
  } = req.body;

  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  if (project.createdBy.toString() !== userId) {
    throw new ApiError(403, "You are not authorized to update this project");
  }

  project.projectTitle = projectTitle || project.projectTitle;
  project.projectDescription = projectDescription || project.projectDescription;
  project.projectGoal = projectGoal || project.projectGoal;
  project.projectDeadline = projectDeadline || project.projectDeadline;
  project.projectCategory = projectCategory || project.projectCategory;

  if (req.files && req.files.projectImage) {
    const { projectImage } = req.files;
    const imageName = `${Date.now()}${projectImage.name}`;
    const imageUploadPath = path.join(
      __dirname,
      `../public/uploads/${imageName}`,
    );

    const oldImagePath = path.join(
      __dirname,
      `../public${project.projectImage}`,
    );
    fs.unlink(oldImagePath, (err) => {
      if (err) {
        console.error("Error deleting the old image: ", err);
      } else {
        console.log("Old image deleted successfully");
      }
    });

    await projectImage.mv(imageUploadPath);

    project.projectImage = "/uploads/" + imageName;
  }

  const updatedProject = await project.save();
  return res.status(200).json({
    success: true,
    message: "Project updated successfully",
    data: updatedProject,
  });
});

const deleteProject = asyncHandler(async (req, res) => {
  const projectId = req.params.id;
  const userId = req.user.id;

  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  if (project.createdBy.toString() !== userId) {
    throw new ApiError(403, "You are not authorized to delete this project");
  }

  await Project.deleteOne({ _id: projectId });

  await Review.deleteMany({ project: projectId });
  await Bookmark.deleteMany({ projectId: projectId });
  await Investor.deleteMany({ projectId: projectId });

  return res.status(200).json({
    success: true,
    message: "Project and related data deleted successfully",
  });
});

const getMyInvestments = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Find all investments made by the user
  const investments = await Investor.find({ investorId: userId }).populate(
    "projectId",
  );

  if (!investments || investments.length === 0) {
    return res.status(404).json({
      success: false,
      message: "No investments found for this user",
    });
  }

  // Extract project details from investments
  const investedProjects = investments.map((investment) => {
    const project = investment.projectId;
    return {
      _id: project._id,
      projectTitle: project.projectTitle,
      projectDescription: project.projectDescription,
      projectGoal: project.projectGoal,
      investedAmount: investment.investedAmount,
      projectDeadline: project.projectDeadline,
      projectImage: project.projectImage,
    };
  });

  return res.status(200).json({
    success: true,
    data: investedProjects,
  });
});

const trendingProjects = asyncHandler(async (req, res) => {
  try {
    const projects = await Project.find()
      .sort({ investedAmount: -1 })
      .limit(4) // Limit the results to 4 projects
      .select("-__v -createdAt -updatedAt") // Exclude unnecessary fields
      .populate("createdBy", "username -_id");

    if (!projects || projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No projects found",
      });
    }

    return res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    throw new ApiError(500, "Server error");
  }
});

module.exports = {
  createProject,
  getAllProjects,
  getOneProject,
  getMyProjects,
  createBookmark,
  getAllBookmarks,
  updateProject,
  deleteProject,
  getMyInvestments,
  trendingProjects,
};
