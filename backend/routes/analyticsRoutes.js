const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");

const {
  getDashboardAnalytics,
  getRevenueAnalytics,
  getUserAnalytics,
  getProductAnalytics
} = require("../controllers/analyticsController");

// Admin: Get dashboard analytics
router.get("/dashboard", auth, getDashboardAnalytics);

// Admin: Get revenue analytics
router.get("/revenue", auth, getRevenueAnalytics);

// Admin: Get user analytics
router.get("/users", auth, getUserAnalytics);

// Admin: Get product analytics
router.get("/products", auth, getProductAnalytics);

module.exports = router;
