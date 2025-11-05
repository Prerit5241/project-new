const Course = require('../models/Course');
const User = require('../models/User');
const TransactionLog = require('../models/TransactionLog');

/**
 * Enroll a user in a course with coin deduction
 * @route POST /api/enrollments/courses/:id/enroll
 * @access Private
 */
exports.enrollInCourse = async (req, res) => {
  try {
    const courseId = parseInt(req.params.id, 10);
    const userId = req.user.userId; // Already parsed by auth middleware
    
    console.log('Enrollment request for:', { courseId, userId });
    
    if (isNaN(courseId) || courseId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID format'
      });
    }
    
    // Find the course
    const course = await Course.findOne({ _id: courseId });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Find the user
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already enrolled
    if (user.isEnrolledIn(courseId)) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course'
      });
    }

    // Check if user has enough coins
    if (user.coins < course.price) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient coins',
        requiredCoins: course.price,
        currentCoins: user.coins
      });
    }

    try {
      // Deduct coins and enroll in course
      user.coins -= course.price;
      await user.enrollInCourse(courseId, course.price);

      // Log the transaction
      const transactionLog = new TransactionLog({
        userId: user._id,
        amount: -course.price,
        type: 'debit',
        reason: `Enrolled in course: ${course.title}`,
        referenceId: courseId,
        referenceType: 'course_enrollment',
        metadata: {
          courseTitle: course.title,
          price: course.price
        }
      });
      await transactionLog.save();

      // Increment course enrollment count
      course.enrollmentCount += 1;
      await course.save();

      console.log('Enrollment successful:', { userId, courseId });
      return res.json({
        success: true,
        message: 'Successfully enrolled in course',
        coins: user.coins,
        courseId: courseId
      });

    } catch (error) {
      console.error('Error during enrollment:', error);
      throw error; // This will be caught by the outer catch block
    }

  } catch (error) {
    console.error('Enrollment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error enrolling in course',
      error: error.message
    });
  }
};

/**
 * Get user's enrolled courses
 * @route GET /api/users/me/courses
 * @access Private
 */
exports.getUserEnrollments = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).populate({
      path: 'enrolledCourses.courseId',
      select: 'title description imageUrl instructor duration level'
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      enrollments: user.enrolledCourses
    });

  } catch (error) {
    console.error('Error getting user enrollments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrolled courses',
      error: error.message
    });
  }
};

/**
 * Check if a user is enrolled in a specific course
 * @route GET /api/enrollments/status/:courseId
 * @access Private
 */
exports.getEnrollmentStatus = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const userId = req.user.userId;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if enrolled
    const isEnrolled = user.isEnrolledIn(courseId);

    res.status(200).json({
      success: true,
      isEnrolled,
      courseId
    });

  } catch (error) {
    console.error('Error checking enrollment status:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking enrollment status',
      error: error.message
    });
  }
};
