const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const enrollmentController = require('../controllers/enrollmentController');

// Enroll in a course (uses coins)
router.post('/courses/:id/enroll', auth, enrollmentController.enrollInCourse);

// Get user's enrolled courses
router.get('/users/me/courses', auth, enrollmentController.getUserEnrollments);

// Get enrollment status for a course
router.get('/status/:courseId', auth, enrollmentController.getEnrollmentStatus);

module.exports = router;
