const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const protect = auth;
const authorize = auth.authorize;
const { 
  updateUserCoins, 
  getUserCoinBalance,
  transferCoins
} = require('../controllers/coinController');

// @desc    Get user's coin balance
// @route   GET /api/coins/balance/:userId
// @access  Private
router.get('/balance/:userId', protect, async (req, res, next) => {
  try {
    const balance = await getUserCoinBalance(req.params.userId);
    res.json({ success: true, balance });
  } catch (error) {
    next(error);
  }
});

// @desc    Update user's coin balance (admin only)
// @route   PUT /api/coins/update/:userId
// @access  Private/Admin
router.put('/update/:userId', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { amount, reason } = req.body;
    if (typeof amount !== 'number') {
      return res.status(400).json({ success: false, message: 'Amount is required and must be a number' });
    }

    const user = await updateUserCoins(req.params.userId, amount);
    
    // Here you might want to log this transaction in a separate collection
    // await TransactionLog.create({
    //   userId: user._id,
    //   amount,
    //   type: amount > 0 ? 'credit' : 'debit',
    //   reason: reason || 'Admin adjustment',
    //   adminId: req.user.id
    // });

    res.json({ 
      success: true, 
      message: 'Coins updated successfully',
      balance: user.coins
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Transfer coins between users
// @route   POST /api/coins/transfer
// @access  Private
router.post('/transfer', protect, async (req, res, next) => {
  try {
    const { toUserId, amount } = req.body;
    
    if (!toUserId || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid toUserId and positive amount are required' 
      });
    }

    const result = await transferCoins(req.user.id, toUserId, amount);
    
    // Log the transaction
    // await TransactionLog.create([
    //   {
    //     userId: req.user.id,
    //     amount: -amount,
    //     type: 'debit',
    //     reason: `Transfer to ${toUserId}`,
    //     relatedUserId: toUserId
    //   },
    //   {
    //     userId: toUserId,
    //     amount: amount,
    //     type: 'credit',
    //     reason: `Transfer from ${req.user.id}`,
    //     relatedUserId: req.user.id
    //   }
    // ]);

    res.json({
      success: true,
      message: 'Coins transferred successfully',
      newBalance: result.newBalance
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;