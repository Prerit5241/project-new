const TransactionLog = require('../models/TransactionLog');
const User = require('../models/User');

/**
 * Get transaction logs with user details
 * @route GET /api/transactions
 * @access Private/Admin
 */
exports.getTransactionLogs = async (req, res) => {
  try {
    const { type, limit = 50, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const query = {};
    if (type) {
      query.referenceType = type;
    }

    // Get transaction logs with pagination
    const logs = await TransactionLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get unique user IDs
    const userIds = [...new Set(logs.map(log => log.userId))];
    
    // Get user details
    const users = await User.find({ _id: { $in: userIds } });
    const userMap = users.reduce((acc, user) => ({
      ...acc,
      [user._id]: {
        email: user.email,
        name: user.name,
        role: user.role
      }
    }), {});

    // Add user details to logs
    const logsWithUserDetails = logs.map(log => ({
      ...log.toObject(),
      user: userMap[log.userId] || {
        email: 'Unknown',
        name: 'Unknown User',
        role: 'user'
      }
    }));

    // Get total count for pagination
    const total = await TransactionLog.countDocuments(query);

    res.json({
      success: true,
      data: logsWithUserDetails,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching transaction logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction logs',
      error: error.message
    });
  }
};
