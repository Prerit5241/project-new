const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const authenticateToken = require('../middlewares/authenticateToken'); // ✅ correct middleware

// Get recent activities for analytics
router.get('/recent', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, type, days = 7 } = req.query;
    
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - parseInt(days));
    
    const query = { timestamp: { $gte: dateLimit } };
    if (type) query.type = type;
    
    const activities = await Activity.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('userId', 'name email')
      .lean();

    // Format for frontend
    const formattedActivities = activities.map(activity => ({
      id: activity._id,
      type: activity.type,
      message: activity.message,
      userName: activity.userName || activity.details?.studentName,
      userRole: activity.userRole,
      userId: activity.details?.userId || activity.userId,
      userEmail: activity.userEmail || activity.details?.email,
      value: activity.value,
      time: formatTimeAgo(activity.timestamp),
      timestamp: activity.timestamp,
      details: activity.details
    }));

    res.json({
      success: true,
      data: formattedActivities,
      total: activities.length
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch activities' });
  }
});

// Get activity statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - parseInt(days));

    const stats = await Activity.aggregate([
      { $match: { timestamp: { $gte: dateLimit } } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch activity stats' });
  }
});

function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval !== 1 ? 's' : ''} ago`;
    }
  }
  
  return 'Just now';
}

module.exports = router;
