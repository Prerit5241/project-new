const Activity = require('../models/Activity');

// @desc    Log an activity
// @route   POST /api/activities/log
// @access  Private
exports.logActivity = async (req, res) => {
  try {
    const { type, details, timestamp } = req.body;
    
    // Create new activity
    const activity = await Activity.create({
      type,
      details,
      timestamp: timestamp || new Date(),
      user: req.user?.id || 'system'
    });

    res.status(201).json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log activity',
      error: error.message
    });
  }
};

// @desc    Get recent activities
// @route   GET /api/activities
// @access  Private
exports.getRecentActivities = async (req, res) => {
  try {
    const { type, limit = 10, days = 7 } = req.query;
    
    const query = {};
    if (type) {
      query.type = type;
    }
    
    if (days) {
      const date = new Date();
      date.setDate(date.getDate() - parseInt(days));
      query.createdAt = { $gte: date };
    }

    const activities = await Activity.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    console.error('Error getting activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get activities',
      error: error.message
    });
  }
};
