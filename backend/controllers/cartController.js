const Cart = require('../models/Cart');
const Course = require('../models/Course');
const Product = require('../models/Product');
const User = require('../models/User');
const ActivityLogger = require('../services/activityLogger');

const buildCartMessage = (type, userName, details) => {
  const displayName = userName && userName.trim().length ? userName.trim() : 'Student';
  const itemType = details?.itemType === 'product' ? 'product' : 'course';
  const itemTitle = details?.courseTitle || details?.title;
  const itemId = details?.courseId;
  const itemLabel = itemTitle
    ? `"${itemTitle}" ${itemType}`
    : itemId
    ? `${itemType} ID ${itemId}`
    : `a ${itemType}`;

  if (type === 'CART_ADD_ITEM') {
    return `Cart update • ${displayName} added ${itemLabel} to the cart.`;
  }

  if (type === 'CART_UPDATE_ITEM') {
    const oldQuantity = details?.oldQuantity ?? '-';
    const newQuantity = details?.newQuantity ?? '-';
    return `Cart update • ${displayName} adjusted ${itemLabel} from ${oldQuantity} to ${newQuantity}.`;
  }

  if (type === 'CART_REMOVE_ITEM') {
    return `Cart update • ${displayName} removed ${itemLabel} from the cart.`;
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

const populateCartRelations = (cart) =>
  cart.populate([
    { path: 'items.course', select: 'title price image imageUrl category description instructor' },
    { path: 'items.product', select: 'title price images description brand' }
  ]);

const idsMatch = (lhs, rhs) => {
  if (!lhs || !rhs) return false;
  const left = typeof lhs === 'object' && lhs !== null ? lhs.toString() : lhs;
  const right = typeof rhs === 'object' && rhs !== null ? rhs.toString() : rhs;
  return left === right;
};

const findCartItemIndex = (items, targetId, itemType) => {
  const normalized = targetId?.toString();
  if (!normalized) return -1;
  return items.findIndex((item) => {
    if (itemType && item.type && item.type !== itemType) return false;
    if (item.course && (!itemType || itemType === 'course') && idsMatch(item.course, normalized)) return true;
    if (item.product && (!itemType || itemType === 'product') && idsMatch(item.product, normalized)) return true;
    return false;
  });
};

// ===== GET USER CART =====
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log(`🛒 Fetching cart for user: ${userId}`);
    
    const cart = await Cart.findOne({ user: userId });

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

    await populateCartRelations(cart);
    cart.items.forEach((item) => {
      if (!item.type) {
        item.type = item.product ? 'product' : 'course';
      }
    });

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
    const {
      courseId,
      productId,
      quantity = 1,
      type: explicitType,
      title: titleOverride,
      price: priceOverride
    } = req.body;
    const userId = req.user.id;

    console.log(
      `🛒 Adding item to cart - User: ${userId}, Course: ${courseId}, Product: ${productId}, Quantity: ${quantity}`
    );

    const targetId = courseId ?? productId;
    const itemType = explicitType || (courseId ? 'course' : productId ? 'product' : null);

    if (!targetId || !itemType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: courseId or productId'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0'
      });
    }

    let itemDoc;
    if (itemType === 'course') {
      itemDoc = await Course.findById(targetId);
      if (!itemDoc) {
        console.log(`❌ Course not found: ${targetId}`);
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      if (req.user.role === 'instructor' && itemDoc.instructor === userId) {
        return res.status(400).json({
          success: false,
          message: 'You cannot add your own course to cart'
        });
      }
    } else if (itemType === 'product') {
      itemDoc = await Product.findById(targetId);
      if (!itemDoc) {
        console.log(`❌ Product not found: ${targetId}`);
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid item type'
      });
    }

    const itemTitle = titleOverride || itemDoc.title;
    const itemPrice = typeof priceOverride === 'number' ? priceOverride : itemDoc.price;

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      console.log(`📝 Creating new cart for user: ${userId}`);
      cart = new Cart({ user: userId, items: [] });
    }

    const existingItemIndex = findCartItemIndex(cart.items, itemDoc._id, itemType);

    if (existingItemIndex > -1) {
      const existingItem = cart.items[existingItemIndex];
      const oldQuantity = existingItem.quantity;
      existingItem.quantity += quantity;
      existingItem.title = itemTitle;
      existingItem.price = itemPrice;
      existingItem.type = itemType;

      if (itemType === 'course') {
        existingItem.course = itemDoc._id;
      } else {
        existingItem.product = itemDoc._id;
        existingItem.brand = itemDoc.brand || existingItem.brand;
      }

      console.log(
        `📦 Updated existing ${itemType} quantity from ${oldQuantity} to ${existingItem.quantity}`
      );
    } else {
      const newItem = {
        title: itemTitle,
        price: itemPrice,
        quantity,
        type: itemType
      };

      if (itemType === 'course') {
        newItem.course = itemDoc._id;
      } else {
        newItem.product = itemDoc._id;
        newItem.brand = itemDoc.brand;
      }

      cart.items.push(newItem);
      console.log(`➕ Added new ${itemType} to cart: ${itemTitle}`);
    }

    await cart.save();
    await populateCartRelations(cart);
    cart.items.forEach((item) => {
      if (!item.type) {
        item.type = item.product ? 'product' : 'course';
      }
    });

    await logCartActivity(userId, 'CART_ADD_ITEM', {
      courseId: itemDoc._id,
      courseTitle: itemTitle,
      title: itemTitle,
      itemType,
      quantity,
      cartTotal: cart.totalAmount
    });

    console.log(`✅ Item added to cart successfully. New total: ₹${cart.totalAmount}`);

    res.json({
      success: true,
      message: 'Item added to cart successfully',
      cart,
      addedItem: {
        id: itemDoc._id,
        type: itemType,
        title: itemTitle,
        price: itemPrice,
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
    const { quantity, itemType } = req.body;
    const userId = req.user.id;

    console.log(`🔄 Updating cart item - User: ${userId}, Item: ${courseId}, Type: ${itemType}, New Quantity: ${quantity}`);

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

    const itemIndex = findCartItemIndex(cart.items, courseId, itemType);

    if (itemIndex === -1) {
      return res.status(404).json({ 
        success: false,
        message: 'Item not found in cart' 
      });
    }

    const item = cart.items[itemIndex];
    const resolvedType = item.type || itemType || (item.product ? 'product' : 'course');
    const oldQuantity = item.quantity;
    const itemTitle = item.title;

    if (quantity === 0) {
      // Remove item if quantity is 0
      cart.items.splice(itemIndex, 1);
      console.log(`🗑️ Removed item from cart: ${itemTitle}`);
    } else {
      // Update quantity
      item.quantity = quantity;
      item.type = resolvedType;
      console.log(`📦 Updated item quantity from ${oldQuantity} to ${quantity}: ${itemTitle}`);
    }

    await cart.save();
    await populateCartRelations(cart);
    cart.items.forEach((entry) => {
      if (!entry.type) {
        entry.type = entry.product ? 'product' : 'course';
      }
    });

    await logCartActivity(userId, quantity === 0 ? 'CART_REMOVE_ITEM' : 'CART_UPDATE_ITEM', {
      courseId,
      courseTitle: itemTitle,
      itemType: resolvedType,
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
        newQuantity: quantity,
        type: resolvedType
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
    const { itemType } = req.body || {};

    console.log(`🗑️ Removing item from cart - User: ${userId}, Item: ${courseId}`);

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ 
        success: false,
        message: 'Cart not found' 
      });
    }

    const itemIndex = findCartItemIndex(cart.items, courseId, itemType);

    if (itemIndex === -1) {
      return res.status(404).json({ 
        success: false,
        message: 'Item not found in cart' 
      });
    }

    const removedItem = cart.items[itemIndex];
    const resolvedType = removedItem.type || itemType || (removedItem.product ? 'product' : 'course');
    cart.items.splice(itemIndex, 1);

    await cart.save();
    await populateCartRelations(cart);
    cart.items.forEach((entry) => {
      if (!entry.type) {
        entry.type = entry.product ? 'product' : 'course';
      }
    });
    
    await logCartActivity(userId, 'CART_REMOVE_ITEM', {
      courseId,
      courseTitle: removedItem.title,
      quantity: removedItem.quantity,
      itemType: resolvedType,
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
        price: removedItem.price,
        type: resolvedType
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
const mergeCart = async (req, res) => {
  try {
    const { localCartItems } = req.body;
    const userId = req.user.id;

    console.log(`🔄 Merging cart for user: ${userId}, local items: ${localCartItems?.length || 0}`);

    if (!localCartItems || !Array.isArray(localCartItems) || localCartItems.length === 0) {
      const cart = await Cart.findOne({ user: userId });
      if (cart) {
        await populateCartRelations(cart);
        cart.items.forEach((entry) => {
          if (!entry.type) {
            entry.type = entry.product ? 'product' : 'course';
          }
        });
      }
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
      const localType = localItem.type || localItem.itemType || (localItem.productId ? 'product' : 'course');
      const targetId =
        localType === 'product'
          ? localItem.productId || localItem.product || localItem._id || localItem.id
          : localItem.courseId || localItem.course || localItem._id || localItem.id;

      if (!targetId || (!localItem.title && !localItem.name)) {
        console.log(`⚠️ Skipping invalid local item:`, localItem);
        continue;
      }

      let itemDoc;
      if (localType === 'course') {
        itemDoc = await Course.findById(targetId);
      } else {
        itemDoc = await Product.findById(targetId);
      }

      if (!itemDoc) {
        console.log(`⚠️ Skipping non-existent ${localType}: ${targetId}`);
        continue;
      }

      const existingItemIndex = findCartItemIndex(cart.items, targetId, localType);
      const normalizedPrice = typeof localItem.price === 'number' ? localItem.price : itemDoc.price;
      const normalizedQuantity = localItem.quantity && localItem.quantity > 0 ? localItem.quantity : 1;
      const normalizedTitle = localItem.title || localItem.name || itemDoc.title;

      if (existingItemIndex > -1) {
        const existing = cart.items[existingItemIndex];
        const oldQuantity = existing.quantity;
        existing.quantity += normalizedQuantity;
        existing.title = normalizedTitle;
        existing.price = normalizedPrice;
        existing.type = localType;
        if (localType === 'course') {
          existing.course = itemDoc._id;
        } else {
          existing.product = itemDoc._id;
          existing.brand = itemDoc.brand || existing.brand || localItem.brand;
        }
        console.log(
          `📦 Merged quantities for ${existing.title}: ${oldQuantity} + ${normalizedQuantity} = ${existing.quantity}`
        );
        updatedItems++;
      } else {
        const newItem = {
          title: normalizedTitle,
          price: normalizedPrice,
          quantity: normalizedQuantity,
          type: localType
        };

        if (localType === 'course') {
          newItem.course = itemDoc._id;
        } else {
          newItem.product = itemDoc._id;
          newItem.brand = itemDoc.brand || localItem.brand;
        }

        cart.items.push(newItem);
        console.log(`➕ Added new ${localType} from local storage: ${newItem.title}`);
        mergedItems++;
      }
    }

    await cart.save();
    await populateCartRelations(cart);
    cart.items.forEach((entry) => {
      if (!entry.type) {
        entry.type = entry.product ? 'product' : 'course';
      }
    });
    
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
    const cart = await Cart.findOne({ user: userId });

    if (!cart || cart.items.length === 0) {
      return res.json({
        success: true,
        summary: {
          itemCount: 0,
          totalAmount: 0,
          categories: 0,
          instructors: 0,
          averagePrice: 0,
          uniqueCourses: 0
        },
        message: 'Cart is empty'
      });
    }

    await populateCartRelations(cart);
    cart.items.forEach((entry) => {
      if (!entry.type) {
        entry.type = entry.product ? 'product' : 'course';
      }
    });

    const itemCount = cart.items.reduce((total, item) => total + item.quantity, 0);
    const categories = cart.items
      .filter((item) => item.type === 'course' && item.course)
      .map((item) => item.course.category)
      .filter(Boolean);
    const instructors = cart.items
      .filter((item) => item.type === 'course' && item.course)
      .map((item) => item.course.instructor)
      .filter(Boolean);

    const summary = {
      itemCount,
      totalAmount: cart.totalAmount,
      uniqueCourses: cart.items.length,
      categories: new Set(categories).size,
      instructors: new Set(instructors).size,
      averagePrice: itemCount ? cart.totalAmount / itemCount : 0
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
