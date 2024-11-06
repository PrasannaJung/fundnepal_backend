const router = require("express").Router();

const projectController = require("../controllers/project");
const reviewController = require("../controllers/review");
const { isAuthenticated } = require("../middleware/isAuth");

router.post("/create", isAuthenticated, projectController.createProject);
router.get("/all", projectController.getAllProjects);
router.get("/trending", projectController.trendingProjects);

// router.delete("/delete/:id", isAuthenticated, projectController.deleteProject);
// router.get("/search", projectController.searchProject);
router.get("/:id", projectController.getOneProject);
router.put("/update/:id", isAuthenticated, projectController.updateProject);
router.delete("/delete/:id", isAuthenticated, projectController.deleteProject);

router.post("/review/:pid", isAuthenticated, reviewController.addReview);
router.get("/reviews/:pid", reviewController.getReviews);

router.post(
  "/bookmark/:pid",
  isAuthenticated,
  projectController.createBookmark,
);

router.get("/my/projects", isAuthenticated, projectController.getMyProjects);
router.get("/my/bookmarks", isAuthenticated, projectController.getAllBookmarks);
router.get(
  "/my/investments",
  isAuthenticated,
  projectController.getMyInvestments,
);

module.exports = router;
