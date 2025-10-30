const express = require('express');
const { protect, authorize } = require('../middlewares/auth');
const activityController = require('../controllers/activityController');

// Create a new router instance using Express's Router
const router = express.Router();

// Apply protect middleware to all routes
router.use(function(req, res, next) {
  protect(req, res, next);
});

// Log activity
router.post('/log', activityController.logActivity);

// Get recent activities (admin only)
router.get('/', function(req, res, next) {
  authorize('admin')(req, res, function() {
    activityController.getRecentActivities(req, res, next);
  });
});

// Get recent activities (for dashboard)
router.get('/recent', activityController.getRecentActivities);

module.exports = router;
