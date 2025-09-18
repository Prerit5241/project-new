// controllers/studentController.js
const User = require("../models/User");
const Course = require("../models/Course");

// ===============================
// ENROLL IN COURSE
// ===============================
const enrollCourse = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const courseId = req.params.id; // use ObjectId instead of Number

    console.log("📝 Enrolling student:", studentId, "in course:", courseId);

    // Find course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    console.log("📚 Course found:", course.title, "Price:", course.price);

    // Find student
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    if (student.role !== "student") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    try {
      // Use method on User model
      const enrollment = await student.enrollInCourse(course._id, course.price);

      // Update course enrollment count
      await Course.findByIdAndUpdate(course._id, {
        $inc: { enrollmentCount: 1 },
      });

      console.log("✅ Successfully enrolled student in course");

      res.status(201).json({
        success: true,
        message: "Enrolled successfully",
        enrollment: {
          courseId: course._id,
          courseTitle: course.title,
          price: enrollment.price,
          enrolledAt: enrollment.enrolledAt,
          status: enrollment.status,
        },
      });
    } catch (enrollError) {
      console.error("❌ Enrollment error:", enrollError.message);

      if (enrollError.message.includes("Already enrolled")) {
        return res.status(409).json({
          success: false,
          message: "Already enrolled in this course",
        });
      }

      return res.status(400).json({
        success: false,
        message: enrollError.message,
      });
    }
  } catch (err) {
    console.error("❌ Server error during enrollment:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ===============================
// GET MY COURSES
// ===============================
const getMyCourses = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const student = await User.findById(studentId).populate("enrolledCourses.courseId");

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    res.json({
      success: true,
      courses: student.enrolledCourses || [],
    });
  } catch (err) {
    console.error("❌ Error fetching courses:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Debug endpoint
const getMyCoursesDebug = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const student = await User.findById(studentId);

    res.json({
      success: true,
      enrolledCourses: student?.enrolledCourses || [],
    });
  } catch (err) {
    console.error("❌ Debug error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ===============================
// PROFILE HANDLERS
// ===============================
const getProfile = async (req, res) => {
  try {
    const studentId = req.user.userId || req.user._id;
    const student = await User.findById(studentId).select("-password");

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const stats = student.getEnrollmentStats ? student.getEnrollmentStats() : {};

    res.json({
      success: true,
      student: { ...student.toObject(), enrollmentStats: stats },
    });
  } catch (err) {
    console.error("❌ Error getting profile:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const studentId = req.user.userId || req.user._id;
    const allowedFields = ["name", "email", "phone", "bio"];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const updatedStudent = await User.findByIdAndUpdate(
      studentId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedStudent) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      student: updatedStudent,
    });
  } catch (err) {
    console.error("❌ Error updating profile:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ===============================
// PROGRESS & ENROLLMENT
// ===============================
const getCourseProgress = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const courseId = req.params.id;

    const student = await User.findById(studentId);
    const enrollment = student.getEnrollment(courseId);

    if (!enrollment) {
      return res.status(404).json({ success: false, message: "Not enrolled in this course" });
    }

    res.json({ success: true, progress: enrollment.progress || 0 });
  } catch (err) {
    console.error("❌ Error fetching progress:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateCourseProgress = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const courseId = req.params.id;

    const { progress } = req.body;
    const student = await User.findById(studentId);
    const enrollment = student.getEnrollment(courseId);

    if (!enrollment) {
      return res.status(404).json({ success: false, message: "Not enrolled in this course" });
    }

    enrollment.progress = progress;
    await student.save();

    res.json({ success: true, message: "Progress updated", progress });
  } catch (err) {
    console.error("❌ Error updating progress:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const cancelEnrollment = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const courseId = req.params.id;

    const student = await User.findById(studentId);
    const enrollment = student.getEnrollment(courseId);

    if (!enrollment) {
      return res.status(404).json({ success: false, message: "No enrollment found" });
    }

    enrollment.status = "cancelled";
    await student.save();

    res.json({ success: true, message: "Enrollment cancelled" });
  } catch (err) {
    console.error("❌ Error cancelling enrollment:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const checkEnrollment = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const courseId = req.params.id;

    const student = await User.findById(studentId);
    const enrollment = student.getEnrollment(courseId);

    res.json({
      success: true,
      enrolled: !!enrollment,
      status: enrollment?.status || null,
    });
  } catch (err) {
    console.error("❌ Error checking enrollment:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ===============================
// EXPORT ALL
// ===============================
module.exports = {
  enrollCourse,
  getMyCourses,
  getMyCoursesDebug,
  getProfile,
  updateProfile,
  getCourseProgress,
  updateCourseProgress,
  cancelEnrollment,
  checkEnrollment,
};
