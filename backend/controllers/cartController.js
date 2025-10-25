const Cart = require('../models/Cart');
const Course = require('../models/Course');
const User = require('../models/User');
const ActivityLogger = require('../services/activityLogger');

const buildCartMessage = (type, userName, details) => {
  const displayName = userName && userName.trim().length ? userName.trim() : 'Student';
  const courseTitle = details?.courseTitle || details?.title;
  const courseId = details?.courseId;
  const courseLabel = courseTitle ? `"${courseTitle}"` : courseId ? `course ID ${courseId}` : 'a course';

  if (type === 'CART_ADD_ITEM') {
    return `Cart update • ${displayName} added ${courseLabel} to the cart.`;
  }

  if (type === 'CART_UPDATE_ITEM') {
    const oldQuantity = details?.oldQuantity ?? '-';
    const newQuantity = details?.newQuantity ?? '-';
    return `Cart update • ${displayName} adjusted ${courseLabel} from ${oldQuantity} to ${newQuantity}.`;
  }

  if (type === 'CART_REMOVE_ITEM') {
    return `Cart update • ${displayName} removed ${courseLabel} from the cart.`;
  }

  if (type === 'CART_CLEAR') {
    const items = details?.itemsCleared ?? 0;
    return `Cart update • ${displayName} cleared the cart (${items} items removed).`;
  }

  if (type === 'CART_MERGE') {
    const merged = details?.mergedItems ?? 0;
    const updated = details?.updatedItems ?? 0;
    return `Cart update • ${displayName} merged their cart (${merged} added, ${updated} updated).`;
  }

  return `Cart update • ${displayName} performed action ${type.replace(/_/g, ' ').toLowerCase()}.`;
};

const logCartActivity = async (userId, type, details = {}) => {
  if (!ActivityLogger || typeof ActivityLogger.log !== 'function') return;

  try {
    let userName;
    let userEmail;
    let userRole;

    if (userId) {
      const user = await User.findById(userId).select('name email role');
      if (user) {
        userName = user.name;
        userEmail = user.email;
        userRole = user.role;
      }
    }

    const activityDetails = {
      ...details,
      studentName: userName || 'Student'
    };

    await ActivityLogger.log({
      userId,
      userEmail,
      userName,
      userRole: userRole || 'student',
      type,
      action: type,
      message: buildCartMessage(type, userName, activityDetails),
      details: activityDetails,
      severity: 'low'
    });
  } catch (err) {
    console.warn('Activity logger unavailable:', err?.message || err);
  }
};

// ===== GET USER CART =====
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log(`🛒 Fetching cart for user: ${userId}`);
    
    const cart = await Cart.findOne({ user: userId })
      .populate('items.course', 'title price image category description instructor');
    
    if (!cart) {
      console.log(`📭 No cart found for user: ${userId}, returning empty cart`);
      return res.json({ 
        success: true,
        cart: { 
          items: [], 
          totalAmount: 0,
          user: userId 
        },
        message: 'Cart is empty'
      });
    }
    
    console.log(`✅ Cart fetched successfully for user: ${userId}, items: ${cart.items.length}`);
    
    res.json({ 
      success: true,
      cart,
      message: 'Cart retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Get cart error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch cart',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ===== ADD ITEM TO CART =====
const addItemToCart = async (req, res) => {
  try {
    const { courseId, quantity = 1 } = req.body;
    const userId = req.user.id;

    console.log(`🛒 Adding item to cart - User: ${userId}, Course: ${courseId}, Quantity: ${quantity}`);

    // Validation
    if (!courseId) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required field: courseId'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Quantity must be greater than 0'
      });
    }

    // Validate course exists
    const course = await Course.findById(courseId);
    if (!course) {
      console.log(`❌ Course not found: ${courseId}`);
      return res.status(404).json({ 
        success: false,
        message: 'Course not found' 
      });
    }

    const courseTitle = req.body.title || course.title;
    const coursePrice = typeof req.body.price === 'number' ? req.body.price : course.price;

    // Check if user is trying to add their own course (if instructor)
    if (req.user.role === 'instructor' && course.instructor === userId) {
      return res.status(400).json({ 
        success: false,
        message: 'You cannot add your own course to cart'
      });
    }

    let cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      console.log(`📝 Creating new cart for user: ${userId}`);
      cart = new Cart({ user: userId, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.course.toString() === courseId
    );

    if (existingItemIndex > -1) {
      // Update quantity
      const oldQuantity = cart.items[existingItemIndex].quantity;
      cart.items[existingItemIndex].quantity += quantity;
      console.log(`📦 Updated existing item quantity from ${oldQuantity} to ${cart.items[existingItemIndex].quantity}`);
    } else {
      // Add new item
      cart.items.push({ 
        course: course._id, 
        title: courseTitle, 
        price: coursePrice, 
        quantity 
      });
      console.log(`➕ Added new item to cart: ${courseTitle}`);
    }

    await cart.save();
    
    // Populate the cart before sending response
    await cart.populate('items.course', 'title price image category description instructor');
    
    await logCartActivity(userId, 'CART_ADD_ITEM', {
      courseId,
      courseTitle: courseTitle,
      quantity,
      cartTotal: cart.totalAmount
    });
    
    console.log(`✅ Item added to cart successfully. New total: $${cart.totalAmount}`);
    
    res.json({ 
      success: true,
      message: 'Item added to cart successfully', 
      cart,
      addedItem: {
        courseId: course._id,
        title: courseTitle,
        price: coursePrice,
        quantity
      }
    });
  } catch (error) {
    console.error('❌ Add to cart error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to add item to cart',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ===== UPDATE ITEM QUANTITY =====
const updateItemQuantity = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;

    console.log(`🔄 Updating cart item - User: ${userId}, Course: ${courseId}, New Quantity: ${quantity}`);

    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid quantity. Must be a non-negative number'
      });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ 
        success: false,
        message: 'Cart not found' 
      });
    }

    const itemIndex = cart.items.findIndex(
      item => item.course.toString() === courseId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ 
        success: false,
        message: 'Item not found in cart' 
      });
    }

    const oldQuantity = cart.items[itemIndex].quantity;
    const itemTitle = cart.items[itemIndex].title;

    if (quantity === 0) {
      // Remove item if quantity is 0
      cart.items.splice(itemIndex, 1);
      console.log(`🗑️ Removed item from cart: ${itemTitle}`);
    } else {
      // Update quantity
      cart.items[itemIndex].quantity = quantity;
      console.log(`📦 Updated item quantity from ${oldQuantity} to ${quantity}: ${itemTitle}`);
    }

    await cart.save();
    await cart.populate('items.course', 'title price image category description instructor');
    
    await logCartActivity(userId, quantity === 0 ? 'CART_REMOVE_ITEM' : 'CART_UPDATE_ITEM', {
      courseId,
      courseTitle: itemTitle,
      oldQuantity,
      newQuantity: quantity,
      cartTotal: cart.totalAmount
    });
    
    console.log(`✅ Cart updated successfully. New total: $${cart.totalAmount}`);
    
    res.json({ 
      success: true,
      message: quantity === 0 ? 'Item removed from cart' : 'Cart updated successfully', 
      cart,
      updatedItem: {
        courseId,
        title: itemTitle,
        oldQuantity,
        newQuantity: quantity
      }
    });
  } catch (error) {
    console.error('❌ Update cart error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update cart',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ===== REMOVE ITEM FROM CART =====
const removeItemFromCart = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    console.log(`🗑️ Removing item from cart - User: ${userId}, Course: ${courseId}`);

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ 
        success: false,
        message: 'Cart not found' 
      });
    }

    const itemIndex = cart.items.findIndex(
      item => item.course.toString() === courseId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ 
        success: false,
        message: 'Item not found in cart' 
      });
    }

    const removedItem = cart.items[itemIndex];
    cart.items.splice(itemIndex, 1);

    await cart.save();
    await cart.populate('items.course', 'title price image category description instructor');
    
    await logCartActivity(userId, 'CART_REMOVE_ITEM', {
      courseId,
      courseTitle: removedItem.title,
      quantity: removedItem.quantity,
      cartTotal: cart.totalAmount
    });
    
    console.log(`✅ Item removed from cart: ${removedItem.title}`);
    
    res.json({ 
      success: true,
      message: 'Item removed from cart successfully', 
      cart,
      removedItem: {
        courseId,
        title: removedItem.title,
        quantity: removedItem.quantity,
        price: removedItem.price
      }
    });
  } catch (error) {
    console.error('❌ Remove from cart error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to remove item from cart',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ===== CLEAR ENTIRE CART =====
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`🧹 Clearing cart for user: ${userId}`);

    const cart = await Cart.findOne({ user: userId });
    if (!cart || cart.items.length === 0) {
      return res.json({ 
        success: true,
        message: 'Cart is already empty',
        cart: { items: [], totalAmount: 0, user: userId }
      });
    }

    const itemCount = cart.items.length;
    const totalAmount = cart.totalAmount;

    await Cart.findOneAndDelete({ user: userId });
    
    await logCartActivity(userId, 'CART_CLEAR', {
      itemsCleared: itemCount,
      totalAmount: totalAmount
    });
    
    console.log(`✅ Cart cleared successfully - ${itemCount} items removed`);
    
    res.json({ 
      success: true,
      message: `Cart cleared successfully. ${itemCount} items removed.`,
      clearedCart: {
        itemCount,
        totalAmount
      }
    });
  } catch (error) {
    console.error('❌ Clear cart error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to clear cart',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ===== MERGE LOCALSTORAGE CART WITH DATABASE CART =====
const mergeCart = async (req, res) => {
  try {
    const { localCartItems } = req.body;
    const userId = req.user.id;

    console.log(`🔄 Merging cart for user: ${userId}, local items: ${localCartItems?.length || 0}`);

    if (!localCartItems || !Array.isArray(localCartItems) || localCartItems.length === 0) {
      const cart = await Cart.findOne({ user: userId })
        .populate('items.course', 'title price image category description instructor');
      return res.json({ 
        success: true,
        cart: cart || { items: [], totalAmount: 0, user: userId },
        message: 'No local items to merge'
      });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      console.log(`📝 Creating new cart for user during merge: ${userId}`);
      cart = new Cart({ user: userId, items: [] });
    }

    let mergedItems = 0;
    let updatedItems = 0;

    // Merge local cart items with database cart
    for (const localItem of localCartItems) {
      const courseId = localItem.courseId || localItem._id;
      
      if (!courseId || !localItem.title || !localItem.price) {
        console.log(`⚠️ Skipping invalid local item:`, localItem);
        continue;
      }

      // Validate course exists
      const course = await Course.findById(courseId);
      if (!course) {
        console.log(`⚠️ Skipping non-existent course: ${courseId}`);
        continue;
      }

      const existingItemIndex = cart.items.findIndex(
        item => item.course.toString() === courseId
      );

      if (existingItemIndex > -1) {
        // Update quantity (add local quantity to existing)
        const oldQuantity = cart.items[existingItemIndex].quantity;
        cart.items[existingItemIndex].quantity += localItem.quantity || 1;
        console.log(`📦 Merged quantities for ${localItem.title}: ${oldQuantity} + ${localItem.quantity} = ${cart.items[existingItemIndex].quantity}`);
        updatedItems++;
      } else {
        // Add new item from local storage
        cart.items.push({
          course: courseId,
          title: localItem.title,
          price: localItem.price,
          quantity: localItem.quantity || 1
        });
        console.log(`➕ Added new item from local storage: ${localItem.title}`);
        mergedItems++;
      }
    }

    await cart.save();
    await cart.populate('items.course', 'title price image category description instructor');
    
    await logCartActivity(userId, 'CART_MERGE', {
      mergedItems,
      updatedItems,
      totalItems: cart.items.length,
      totalAmount: cart.totalAmount
    });
    
    console.log(`✅ Cart merge completed - Merged: ${mergedItems}, Updated: ${updatedItems}, Total: ${cart.items.length}`);
    
    res.json({ 
      success: true,
      message: `Cart merged successfully. Added ${mergedItems} new items, updated ${updatedItems} existing items.`, 
      cart,
      mergeStats: {
        mergedItems,
        updatedItems,
        totalItems: cart.items.length
      }
    });
  } catch (error) {
    console.error('❌ Merge cart error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to merge cart',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ===== GET CART ITEM COUNT =====
const getCartCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ user: userId });
    
    const count = cart ? cart.items.reduce((total, item) => total + item.quantity, 0) : 0;
    
    res.json({ 
      success: true,
      count,
      message: 'Cart count retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Get cart count error:', error);
    res.status(500).json({ 
      success: false,
      count: 0,
      message: 'Failed to get cart count',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ===== GET CART SUMMARY =====
const getCartSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ user: userId })
      .populate('items.course', 'title price category instructor');
    
    if (!cart || cart.items.length === 0) {
      return res.json({ 
        success: true,
        summary: {
          itemCount: 0,
          totalAmount: 0,
          categories: [],
          instructors: []
        },
        message: 'Cart is empty'
      });
    }

    // Calculate summary statistics
    const itemCount = cart.items.reduce((total, item) => total + item.quantity, 0);
    const categories = [...new Set(cart.items.map(item => item.course.category))];
    const instructors = [...new Set(cart.items.map(item => item.course.instructor))];

    const summary = {
      itemCount,
      totalAmount: cart.totalAmount,
      uniqueCourses: cart.items.length,
      categories: categories.length,
      instructors: instructors.length,
      averagePrice: cart.totalAmount / itemCount || 0
    };
    
    res.json({ 
      success: true,
      summary,
      message: 'Cart summary retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Get cart summary error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get cart summary',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getCart,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
  clearCart,
  mergeCart,
  getCartCount,
  getCartSummary
};
