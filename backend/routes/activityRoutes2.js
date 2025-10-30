const express = require('express');
const { protect, authorize } = require('../middlewares/auth');
const activityController = require('../controllers/activityController');

// Create a new router instance using Express's Router
const activityRouter = express.Router();

// Apply protect middleware to all routes
activityRouter.use(protect);

// Log activity
activityRouter.post('/log', activityController.logActivity);

// Get recent activities (admin only)
activityRouter.get('/', authorize('admin'), activityController.getRecentActivities);

// Get recent activities (for dashboard)
activityRouter.get('/recent', activityController.getRecentActivities);

module.exports = activityRouter;
