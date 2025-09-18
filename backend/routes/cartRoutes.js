const express = require('express');
const router = express.Router();
const {
  getCart,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
  clearCart,
  mergeCart,
  getCartCount,
  getCartSummary
} = require('../controllers/cartController');
const { authenticateToken } = require('../middlewares/auth');

// ===== MIDDLEWARE =====
// All cart routes require authentication
router.use(authenticateToken);

// ===== CART ROUTES =====

// Get student's cart
router.get('/my-cart', getCart);

// Add item to cart
router.post('/add-item', addItemToCart);

// Update item quantity
router.put('/update-item/:courseId', updateItemQuantity);

// Remove item from cart
router.delete('/remove-item/:courseId', removeItemFromCart);

// Clear entire cart
router.delete('/clear', clearCart);

// Merge localStorage cart with database cart (for login)
router.post('/merge', mergeCart);

// Get cart count only
router.get('/count', getCartCount);

// Get cart summary (new addition)
router.get('/summary', getCartSummary);

// ===== ROUTE DOCUMENTATION =====
// GET    /api/cart/my-cart           - Get user's complete cart with populated course details
// GET    /api/cart/count             - Get total item count in cart
// GET    /api/cart/summary           - Get cart statistics and summary
// POST   /api/cart/add-item          - Add a course to cart
// POST   /api/cart/merge             - Merge localStorage cart with database cart
// PUT    /api/cart/update-item/:id   - Update quantity of specific cart item
// DELETE /api/cart/remove-item/:id   - Remove specific item from cart
// DELETE /api/cart/clear             - Clear entire cart

module.exports = router;
