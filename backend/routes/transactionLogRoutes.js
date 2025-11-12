const express = require('express');
const router = express.Router();
const { getTransactionLogs } = require('../controllers/transactionLogController');
const auth = require('../middlewares/auth');

// Get transaction logs (admin only)
router.get('/', auth, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  next();
}, getTransactionLogs);

module.exports = router;
