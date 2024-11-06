const express = require("express");
const router = express.Router();

const {
  verifyPayment,
  createInvestmentOrder,
  mobilePayment,
} = require("../controllers/esewa");
const { isAuthenticated } = require("../middleware/isAuth");

router.get("/esewa/verify-payment", verifyPayment);
router.post(
  "/project/esewa/:pid/invest",
  isAuthenticated,
  createInvestmentOrder,
);

router.post("/mobile_payment", isAuthenticated, mobilePayment);

module.exports = router;
