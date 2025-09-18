const mongoose = require('mongoose');
const { getNextId } = require('./Counter');

const orderSchema = new mongoose.Schema(
  {
    _id: {
      type: Number,
      required: true
    },
    user: { 
      type: Number,           // User ID from 101+ range
      ref: 'User', 
      required: true 
    },
    products: [
      {
        product: { 
          type: Number,         // ✅ Fixed: Changed to Number for product ID (1001+ range)
          ref: 'Product',
          required: true
        },
        quantity: { 
          type: Number, 
          required: true,
          min: 1
        },
        price: {               // ✅ Added: Store price at time of order
          type: Number,
          required: true,
          min: 0
        },
        title: {               // ✅ Added: Store product title at time of order
          type: String,
          required: true
        }
      }
    ],
    courses: [                 // ✅ Added: Support for course orders
      {
        course: { 
          type: Number,        // Course ID from 2001+ range
          ref: 'Course',
          required: true
        },
        price: {               // Store course price at time of order
          type: Number,
          required: true,
          min: 0
        },
        title: {               // Store course title at time of order
          type: String,
          required: true
        }
      }
    ],
    totalAmount: { 
      type: Number, 
      required: true,
      min: 0
    },
    shippingAddress: {
      address: String,
      city: String,
      postalCode: String,
      country: String,
    },
    status: { 
      type: String, 
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: "pending" 
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash_on_delivery'],
      required: true
    },
    paymentStatus: {           // ✅ Added: Track payment status separately
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    paymentResult: {
      id: String,
      status: String,
      update_time: String,
      email_address: String,
    },
    orderType: {               // ✅ Added: Distinguish order types
      type: String,
      enum: ['product', 'course', 'mixed'],
      required: true
    },
    orderNotes: {              // ✅ Added: Customer notes
      type: String,
      trim: true,
      maxlength: 500
    }
  },
  { 
    timestamps: true,
    _id: false // ✅ Disable automatic ObjectId generation
  }
);

// ✅ Pre-save middleware to auto-generate order ID
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this._id) {
    try {
      this._id = await getNextId('orderId'); // ✅ Will generate 10001, 10002, 10003...
      console.log('✅ Generated new order ID:', this._id);
    } catch (error) {
      console.error('❌ Error generating order ID:', error);
      return next(error);
    }
  }
  next();
});

// ✅ Pre-save middleware to determine order type
orderSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('products') || this.isModified('courses')) {
    const hasProducts = this.products && this.products.length > 0;
    const hasCourses = this.courses && this.courses.length > 0;
    
    if (hasProducts && hasCourses) {
      this.orderType = 'mixed';
    } else if (hasProducts) {
      this.orderType = 'product';
    } else if (hasCourses) {
      this.orderType = 'course';
    }
  }
  next();
});

// ✅ Indexes for performance
orderSchema.index({ user: 1 }); // Orders by user
orderSchema.index({ status: 1 }); // Orders by status
orderSchema.index({ paymentStatus: 1 }); // Orders by payment status
orderSchema.index({ orderType: 1 }); // Orders by type
orderSchema.index({ createdAt: -1 }); // Recent orders first
orderSchema.index({ user: 1, status: 1 }); // Compound index for user orders by status

// ✅ Virtual for total items count
orderSchema.virtual('totalItems').get(function() {
  const productItems = this.products ? this.products.reduce((sum, item) => sum + item.quantity, 0) : 0;
  const courseItems = this.courses ? this.courses.length : 0;
  return productItems + courseItems;
});

// ✅ Instance method to check if order can be cancelled
orderSchema.methods.canBeCancelled = function() {
  return ['pending', 'processing'].includes(this.status);
};

// ✅ Instance method to calculate subtotal for products
orderSchema.methods.getProductSubtotal = function() {
  if (!this.products || this.products.length === 0) return 0;
  return this.products.reduce((sum, item) => sum + (item.price * item.quantity), 0);
};

// ✅ Instance method to calculate subtotal for courses
orderSchema.methods.getCourseSubtotal = function() {
  if (!this.courses || this.courses.length === 0) return 0;
  return this.courses.reduce((sum, item) => sum + item.price, 0);
};

// ✅ Instance method to mark as paid
orderSchema.methods.markAsPaid = async function(paymentResult = {}) {
  this.paymentStatus = 'paid';
  this.paymentResult = paymentResult;
  if (this.status === 'pending') {
    this.status = 'processing';
  }
  return await this.save();
};

// ✅ Static method to get user orders
orderSchema.statics.getUserOrders = function(userId, limit = 20) {
  return this.find({ user: userId })
    .populate('products.product', 'title images')
    .populate('courses.course', 'title')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// ✅ Static method to get orders by status
orderSchema.statics.getOrdersByStatus = function(status, limit = 50) {
  return this.find({ status })
    .populate('user', 'name email')
    .populate('products.product', 'title')
    .populate('courses.course', 'title')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// ✅ Static method to get recent orders
orderSchema.statics.getRecentOrders = function(limit = 10) {
  return this.find()
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// ✅ Static method to get order statistics
orderSchema.statics.getOrderStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' }
      }
    }
  ]);
  
  const result = {
    total: 0,
    totalRevenue: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0
  };
  
  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
    result.totalRevenue += stat.totalAmount;
  });
  
  return result;
};

module.exports = mongoose.model('Order', orderSchema);
 