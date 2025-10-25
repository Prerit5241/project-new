const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const auth = require('../middlewares/auth');

// Generic role-based authorization middleware
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({ msg: 'Access denied' });
  };
}

// ===============================
// COURSE MANAGEMENT ROUTES
// ===============================

// CREATE A COURSE (Admin + Instructor)
router.post(
  '/',
  auth,
  authorizeRoles('admin', 'instructor'),
  courseController.createCourse
);

// GET all courses (public)
router.get('/', courseController.getCourses);

// GET course by ID (public)
router.get('/:id', courseController.getCourseById);

// UPDATE a course (Admin + Instructor)
router.put(
  '/:id',
  auth,
  authorizeRoles('admin', 'instructor'),
  courseController.updateCourse
);

// DELETE a course (Admin + Instructor)
router.delete(
  '/:id',
  auth,
  authorizeRoles('admin', 'instructor'),
  courseController.deleteCourse
);

// ===============================
// COURSE CONTENT DELIVERY ROUTES
// ===============================

// ✅ Get course modules (for enrolled students)
router.get('/:id/modules', auth, courseController.getCourseModules);

// ✅ Get specific module
router.get('/:id/modules/:moduleIndex', auth, courseController.getModule);

// ✅ Get specific lesson
router.get('/:id/modules/:moduleIndex/lessons/:lessonIndex', auth, courseController.getLesson);

// ✅ Mark lesson as complete
router.post('/:id/modules/:moduleIndex/lessons/:lessonIndex/complete', auth, courseController.markLessonComplete);

// ✅ Get course progress summary
router.get('/:id/progress', auth, courseController.getCourseProgress);

// ===============================
// COURSE CONTENT CREATION ROUTES
// ===============================

// ✅ Add module to course (Admin + Instructor)
router.post(
  '/:id/modules',
  auth,
  authorizeRoles('admin', 'instructor'),
  courseController.addModule
);

// ✅ Add lesson to module (Admin + Instructor)
router.post(
  '/:id/modules/:moduleIndex/lessons',
  auth,
  authorizeRoles('admin', 'instructor'),
  courseController.addLesson
);

// ✅ Update module (Admin + Instructor) - COMMENT OUT IF CAUSING ERROR
/*
router.put(
  '/:id/modules/:moduleIndex',
  auth,
  authorizeRoles('admin', 'instructor'), 
  courseController.updateModule
);
*/

// ✅ Delete module (Admin + Instructor) - COMMENT OUT IF CAUSING ERROR
/*
router.delete(
  '/:id/modules/:moduleIndex',
  auth,
  authorizeRoles('admin', 'instructor'),
  courseController.deleteModule
);
*/

module.exports = router;
