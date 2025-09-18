// models/SubCategory.js
const mongoose = require('mongoose');
const { getNextId } = require('./Counter');
const Schema = mongoose.Schema;

const subCategorySchema = new Schema(
  {
    _id: {
      type: Number, // Numeric ID like Category
      required: true
    },
    name: {
      type: String,
      required: [true, 'Subcategory name is required'],
      trim: true,
    },
    category: {
      type: Number, // Parent category's _id
      ref: 'Category',
      required: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { 
    timestamps: true,
    _id: false // ✅ Disable automatic ObjectId generation
  }
);

// ✅ Pre-save middleware to auto-generate subcategory ID using separate range
subCategorySchema.pre('save', async function(next) {
  if (this.isNew && !this._id) {
    try {
      this._id = await getNextId('subCategoryId'); // ✅ Will generate 301, 302, 303...
      console.log('✅ Generated new subcategory ID:', this._id);
    } catch (error) {
      console.error('❌ Error generating subcategory ID:', error);
      return next(error);
    }
  }
  next();
});

// ✅ Add indexes for better performance
subCategorySchema.index({ category: 1 }); // Index on parent category
subCategorySchema.index({ name: 1 }); // Index on name for searches
subCategorySchema.index({ name: 1, category: 1 }); // Compound index for unique name per category

module.exports = mongoose.model('SubCategory', subCategorySchema);
