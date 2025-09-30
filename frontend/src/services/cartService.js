import toast from 'react-hot-toast';

class CartService {
  constructor() {
    this.storageKey = 'cartItems';
  }

  // Get all cart items
  getCartItems() {
    if (typeof window === 'undefined') return [];
    try {
      const items = localStorage.getItem(this.storageKey);
      return items ? JSON.parse(items) : [];
    } catch (error) {
      console.error('Error reading cart items:', error);
      return [];
    }
  }

  // Add item to cart
  async addToCart(item) {
    try {
      const cartItems = this.getCartItems();
      const existingItemIndex = cartItems.findIndex(cartItem => 
        cartItem.itemId === item.itemId && cartItem.type === item.type
      );

      if (existingItemIndex > -1) {
        // Update quantity if item exists
        cartItems[existingItemIndex].quantity += item.quantity || 1;
      } else {
        // Add new item
        cartItems.push({
          itemId: item.itemId,
          title: item.title,
          price: item.price,
          quantity: item.quantity || 1,
          type: item.type || 'product',
          addedAt: new Date().toISOString()
        });
      }

      localStorage.setItem(this.storageKey, JSON.stringify(cartItems));
      return { success: true, message: 'Item added to cart successfully' };
    } catch (error) {
      console.error('Error adding to cart:', error);
      return { success: false, message: 'Failed to add item to cart' };
    }
  }

  // Remove item from cart
  removeFromCart(itemId, type = 'product') {
    try {
      const cartItems = this.getCartItems();
      const updatedItems = cartItems.filter(item => 
        !(item.itemId === itemId && item.type === type)
      );
      
      localStorage.setItem(this.storageKey, JSON.stringify(updatedItems));
      return { success: true, message: 'Item removed from cart' };
    } catch (error) {
      console.error('Error removing from cart:', error);
      return { success: false, message: 'Failed to remove item from cart' };
    }
  }

  // Update item quantity
  updateQuantity(itemId, quantity, type = 'product') {
    try {
      const cartItems = this.getCartItems();
      const itemIndex = cartItems.findIndex(item => 
        item.itemId === itemId && item.type === type
      );

      if (itemIndex > -1) {
        if (quantity <= 0) {
          cartItems.splice(itemIndex, 1);
        } else {
          cartItems[itemIndex].quantity = quantity;
        }
        localStorage.setItem(this.storageKey, JSON.stringify(cartItems));
        return { success: true, message: 'Cart updated successfully' };
      } else {
        return { success: false, message: 'Item not found in cart' };
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      return { success: false, message: 'Failed to update cart' };
    }
  }

  // Clear entire cart
  clearCart() {
    try {
      localStorage.removeItem(this.storageKey);
      return { success: true, message: 'Cart cleared successfully' };
    } catch (error) {
      console.error('Error clearing cart:', error);
      return { success: false, message: 'Failed to clear cart' };
    }
  }

  // Get cart count
  getCartCount() {
    const items = this.getCartItems();
    return items.reduce((total, item) => total + (item.quantity || 1), 0);
  }

  // Get cart total
  getCartTotal() {
    const items = this.getCartItems();
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
}

// Create and export singleton instance
const cartService = new CartService();
export default cartService;
