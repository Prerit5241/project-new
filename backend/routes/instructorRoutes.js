// E:\college project\backend\routes\instructorRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const User = require("../models/User"); // Your MongoDB User model

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
