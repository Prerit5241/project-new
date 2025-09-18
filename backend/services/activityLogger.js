// services/activityLogger.js
const Activity = require('../models/Activity');

class ActivityLogger {
  static async log({
    userId = null,
    userEmail = null,
    type,
    action = null,
    message,
    details = {},
    severity = 'low',
    req = null
  }) {
    try {
      // Extract IP and User Agent from request if provided
      if (req) {
        details.ipAddress = req.ip || req.connection.remoteAddress;
        details.userAgent = req.get('User-Agent');
      }

      const activity = new Activity({
        userId,
        userEmail,
        type,
        action,
        message,
        details,
        severity,
        timestamp: new Date()
      });

      await activity.save();
      console.log(`📝 Activity logged: ${type} - ${message}`);
      return activity;
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  // Convenience methods for common activities
  static async logLogin(user, req) {
    return this.log({
      userId: user._id,
      userEmail: user.email,
      type: 'user_login',
      message: `${user.email} logged in`,
      details: { role: user.role },
      req
    });
  }

  static async logLogout(user, req) {
    return this.log({
      userId: user._id,
      userEmail: user.email,
      type: 'user_logout', 
      message: `${user.email} logged out`,
      req
    });
  }

  static async logProductView(user, product, req) {
    return this.log({
      userId: user?._id,
      userEmail: user?.email,
      type: 'product_view',
      message: `${user?.email || 'Anonymous'} viewed ${product.title}`,
      details: { 
        productId: product._id,
        productTitle: product.title,
        productPrice: product.price 
      },
      req
    });
  }

  static async logOrder(user, order, req) {
    return this.log({
      userId: user._id,
      userEmail: user.email,
      type: 'order_placed',
      message: `${user.email} placed order #${order._id}`,
      details: { 
        orderId: order._id,
        amount: order.total,
        itemCount: order.items?.length 
      },
      severity: 'medium',
      req
    });
  }
}

module.exports = ActivityLogger;
