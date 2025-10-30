const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema(
  {
    user: { 
      type: Number,
      ref: 'User', 
      required: true, 
      unique: true 
    },
    
    items: [
      {
        course: {                  // For course items
          type: Number,
          ref: 'Course',
          required: false         // ✅ Made optional since we can have products too
        },
        product: {                // ✅ Added for product items
          type: Number,
          ref: 'Product',
          required: false
        },
        type: {
          type: String,
          enum: ['course', 'product'],
          default: 'course'
        },
        title: {
          type: String,
          required: true
        },
        price: {
          type: Number,
          required: true
        },
        quantity: { 
          type: Number, 
          required: true, 
          default: 1 
        },
        addedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    
    totalAmount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// ✅ Enhanced validation: Each item must have either course or product
cartSchema.path('items').validate(function(items) {
  for (let item of items) {
    if (!item.course && !item.product) {
      return false; // Item must have either course or product reference
    }
    if (item.course && item.product) {
      return false; // Item cannot have both course and product reference
    }
  }
  return true;
}, 'Each cart item must have either a course or product reference, but not both');

// Calculate total amount before saving
cartSchema.pre('save', function(next) {
  this.totalAmount = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  next();
});

module.exports = mongoose.model('Cart', cartSchema);
