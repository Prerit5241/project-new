const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");

// Import student controller
const studentController = require("../controllers/studentController");
// Import course controller
const courseController = require("../controllers/courseController");

// ✅ Safe wrapper to avoid "handler must be a function" crash
const wrap = (fn, name = "unknownHandler") => {
  if (typeof fn !== "function") {
    console.error(`❌ Route handler "${name}" is not a function. Check your controller export.`);
    return (req, res) =>
      res.status(500).json({
        success: false,
        message: `Route handler "${name}" is missing in controller`
      });
  }
  return fn;
};

// Extract handlers safely
const {
  enrollCourse,
  getMyCourses,
  getMyCoursesDebug,
  updateProfile,
  getProfile,
  getCourseProgress,
  updateCourseProgress,
  cancelEnrollment,
  checkEnrollment
} = studentController;

const {
  getCourseModules,
  getModule,
  getLesson,
  markLessonComplete
} = courseController;

// ✅ Middleware: only students allowed
const studentOnly = (req, res, next) => {
  if (req.user.role && req.user.role !== "student") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Students only."
    });
  }
  next();
};

// Apply auth middleware globally
router.use(auth);

// ===============================
// STUDENT PROFILE ROUTES
// ===============================
router.get("/me", async (req, res) => {
  try {
    const studentId = req.user.userId || req.user._id;
    console.log("👤 Getting student profile:", studentId);

    const User = require("../models/User");
    const student = await User.findById(studentId).select("-password");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    const stats = student.getEnrollmentStats();

    res.json({
      success: true,
      student: {
        ...student.toObject(),
        enrollmentStats: stats
      }
    });
  } catch (err) {
    console.error("❌ Error getting student profile:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/profile", wrap(getProfile, "getProfile"));
router.put("/profile", studentOnly, wrap(updateProfile, "updateProfile"));

// ===============================
// COURSE ENROLLMENT ROUTES
// ===============================
router.post("/enroll/:id", studentOnly, wrap(enrollCourse, "enrollCourse"));
router.get("/my-courses", studentOnly, wrap(getMyCourses, "getMyCourses"));
router.get("/debug-courses", studentOnly, wrap(getMyCoursesDebug, "getMyCoursesDebug"));
router.delete("/enroll/:id", studentOnly, wrap(cancelEnrollment, "cancelEnrollment"));
router.get("/enrollment/:id", studentOnly, wrap(checkEnrollment, "checkEnrollment"));

// Reactivate enrollment
router.patch("/enroll/:id/reactivate", studentOnly, async (req, res) => {
  try {
    const studentId = req.user.userId;
    const courseId = Number(req.params.id);

    console.log("🔄 Reactivating enrollment for student:", studentId, "course:", courseId);

    const User = require("../models/User");
    const Course = require("../models/Course");

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const enrollment = student.getEnrollment(courseId);
    if (!enrollment) {
      return res.status(404).json({ success: false, message: "No enrollment found for this course" });
    }

    if (enrollment.status === "active") {
      return res.status(400).json({ success: false, message: "Enrollment is already active" });
    }

    enrollment.status = "active";
    await student.save();

    const course = await Course.findById(courseId);
    if (course) {
      course.enrollmentCount = (course.enrollmentCount || 0) + 1;
      await course.save();
    }

    res.json({ success: true, message: "Enrollment reactivated successfully" });
  } catch (err) {
    console.error("❌ Error reactivating enrollment:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ===============================
// COURSE CONTENT ROUTES
// ===============================
router.get("/courses/:id/modules", studentOnly, wrap(getCourseModules, "getCourseModules"));
router.get("/courses/:id/modules/:moduleIndex", studentOnly, wrap(getModule, "getModule"));
router.get("/courses/:id/modules/:moduleIndex/lessons/:lessonIndex", studentOnly, wrap(getLesson, "getLesson"));
router.post(
  "/courses/:id/modules/:moduleIndex/lessons/:lessonIndex/complete",
  studentOnly,
  wrap(markLessonComplete, "markLessonComplete")
);

// ===============================
// PROGRESS & STATS ROUTES
// ===============================
router.get("/stats", studentOnly, async (req, res) => {
  try {
    const studentId = req.user.userId;
    console.log("📊 Getting enrollment stats for student:", studentId);

    const User = require("../models/User");
    const student = await User.findById(studentId);

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const stats = student.getEnrollmentStats();
    res.json({ success: true, stats });
  } catch (err) {
    console.error("❌ Error getting enrollment stats:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/progress/:id", studentOnly, wrap(getCourseProgress, "getCourseProgress"));
router.put("/progress/:id", studentOnly, wrap(updateCourseProgress, "updateCourseProgress"));

// ===============================
// COURSE DISCOVERY ROUTES
// ===============================
router.get("/courses/all", async (req, res) => {
  try {
    const studentId = req.user.userId;
    console.log("📚 Getting all courses for student:", studentId);

    const User = require("../models/User");
    const Course = require("../models/Course");

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const allCourses = await Course.find({}).populate("instructor", "name email").lean();

    const coursesWithEnrollmentStatus = allCourses.map((course) => {
      const enrollment = student.getEnrollment(course._id);
      return {
        ...course,
        isEnrolled: !!enrollment,
        enrollmentStatus: enrollment?.status || null,
        enrollmentProgress: enrollment?.progress || 0
      };
    });

    res.json({ success: true, courses: coursesWithEnrollmentStatus, count: coursesWithEnrollmentStatus.length });
  } catch (err) {
    console.error("❌ Error getting all courses:", err);
    res.status(500).json({ success: false, message: "Server error", courses: [] });
  }
});

router.get("/recommendations", studentOnly, async (req, res) => {
  try {
    const studentId = req.user.userId;
    console.log("💡 Getting course recommendations for student:", studentId);

    const User = require("../models/User");
    const Course = require("../models/Course");

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const enrolledCourseIds = student.enrolledCourses?.map((e) => e.courseId) || [];

    const availableCourses = await Course.find({ _id: { $nin: enrolledCourseIds } })
      .populate("instructor", "name email")
      .limit(10)
      .lean();

    res.json({ success: true, recommendations: availableCourses, count: availableCourses.length });
  } catch (err) {
    console.error("❌ Error getting recommendations:", err);
    res.status(500).json({ success: false, message: "Server error", recommendations: [] });
  }
});

// ===============================
// UTILITY ROUTES
// ===============================
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Student routes are working",
    timestamp: new Date().toISOString(),
    studentId: req.user?.userId || null
  });
});

module.exports = router;
