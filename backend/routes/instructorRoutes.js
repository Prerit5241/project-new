// E:\college project\backend\routes\instructorRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const User = require("../models/User"); // Your MongoDB User model

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({ success: false, msg: "Access denied" });
  };
}

// GET /api/instructor/ - list all instructors (admin only)
router.get(
  "/",
  auth,
  authorizeRoles("admin"),
  async (_req, res) => {
    try {
      const instructors = await User.find({ role: "instructor" })
        .select("_id name email profile.avatar")
        .sort({ name: 1 });

      res.json({ success: true, data: instructors });
    } catch (err) {
      console.error("Failed to fetch instructors", err);
      res.status(500).json({ success: false, msg: "Failed to fetch instructors" });
    }
  }
);

// GET /api/instructor/me
router.get("/me", auth, async (req, res) => {
  try {
    const instructor = await User.findById(req.user.userId).select("-password");

    if (!instructor || instructor.role !== "instructor") {
      return res.status(403).json({ success: false, msg: "Access denied" });
    }

    res.json({ success: true, instructor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

module.exports = router;
