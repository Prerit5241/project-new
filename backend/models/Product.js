const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema(
  {
    _id: {
      type: Number, // Numeric ID
      required: true
    },
    title: {  // ✅ renamed from 'name' to 'title' to match frontend
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: ''
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: 0
    },
    category: {
      type: Number,
      ref: 'Category',
      required: [true, 'Product category is required']
    },
    subCategory: {
      type: Number,
      ref: 'SubCategory',
      required: false
    },
    stock: {
      type: Number,
      default: 0,
      min: 0
    },
    images: [
      {
        type: String,
        trim: true
      }
    ],
    brand: {
      type: String,
      trim: true,
      default: ''
    },
    featured: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performance
productSchema.index({ category: 1 });
productSchema.index({ subCategory: 1 });

module.exports = mongoose.model('Product', productSchema);
