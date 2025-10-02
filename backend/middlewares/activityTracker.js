const Activity = require('../models/Activity');

const ActivityTracker = {
  // Generic activity logger with better type handling
  async logActivity(type, userId, userName, userRole, message, details = {}, req = null) {
    try {
      const activity = new Activity({
        type,
        userId: userId, // Keep as-is, schema now accepts Mixed type
        userName: userName || 'Unknown User',
        userRole: userRole || 'student',
        message,
        details,
        value: details.value ? String(details.value) : null, // ✅ Convert to string
        ipAddress: req ? (req.ip || req.connection?.remoteAddress) : null,
        userAgent: req ? req.get('User-Agent') : null
      });
      
      await activity.save();
      console.log(`✅ Activity logged: ${type} - ${message}`);
      return activity;
    } catch (error) {
      console.error('❌ Failed to log activity:', error);
      console.error('❌ Activity data that failed:', {
        type, userId, userName, userRole, message, details
      });
      // Don't throw error, just log it so it doesn't break the login flow
    }
  },

  // Specific activity loggers
  async logUserRegistration(user, req) {
    return this.logActivity(
      'user_register',
      user._id || user.id,
      user.name || user.email,
      user.role || 'student',
      `New ${user.role || 'student'} registered: ${user.name || user.email}`,
      { email: user.email },
      req
    );
  },

  async logUserLogin(user, req) {
    return this.logActivity(
      'user_login',
      user._id || user.id, // Handle both _id and id
      user.name || user.email,
      user.role || 'student',
      `${user.name || user.email} logged in`,
      {},
      req
    );
  },

  async logUserLogout(user, req) {
    return this.logActivity(
      'user_logout',
      user._id || user.id,
      user.name || user.email,
      user.role || 'student',
      `${user.name || user.email} logged out`,
      {},
      req
    );
  },

  async logSearch(query, userId, userName, req) {
    return this.logActivity(
      'search',
      userId,
      userName || 'Anonymous User',
      'student',
      `Search performed: "${query}"`,
      { searchQuery: query },
      req
    );
  },

  async logPurchase(order, user, req) {
    return this.logActivity(
      'purchase',
      user._id || user.id,
      user.name || user.email,
      user.role || 'student',
      `${user.name || user.email} made a purchase`,
      { 
        orderId: order._id, 
        amount: order.total,
        value: `$${order.total}`
      },
      req
    );
  },

  async logAddToCart(product, user, req) {
    return this.logActivity(
      'add_to_cart',
      user._id || user.id,
      user.name || user.email,
      user.role || 'student',
      `${user.name || user.email} added "${product.title}" to cart`,
      { 
        productId: product._id,
        value: `$${product.price}`
      },
      req
    );
  },

  async logCourseCreation(course, instructor, req) {
    return this.logActivity(
      'course_created',
      instructor._id || instructor.id,
      instructor.name || instructor.email,
      'instructor',
      `${instructor.name || instructor.email} created course "${course.title}"`,
      { courseId: course._id },
      req
    );
  },

  async logInstructorAction(action, instructor, details, req) {
    return this.logActivity(
      'instructor_action',
      instructor._id || instructor.id,
      instructor.name || instructor.email,
      'instructor',
      `${instructor.name || instructor.email} ${action}`,
      details,
      req
    );
  }
};

module.exports = ActivityTracker;
