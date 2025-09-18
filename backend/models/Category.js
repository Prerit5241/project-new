const mongoose = require('mongoose');
const { getNextId } = require('./Counter');

const categorySchema = new mongoose.Schema({
  _id: { 
    type: Number, 
    required: true  // ✅ Numeric ID required
  },
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true 
  },
  description: { 
    type: String, 
    trim: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  displayOrder: { 
    type: Number, 
    default: 0 
  }
}, {
  _id: false, // ✅ Disable automatic ObjectId _id
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      if (ret._id) {
        ret.id = ret._id;
      }
      return ret;
    }
  }
});

// ✅ COMBINED: Auto-generate ID for new categories
categorySchema.pre('save', async function(next) {
  try {
    // Generate ID for new categories
    if (this.isNew && !this._id) {
      this._id = await getNextId('categoryId');
      console.log('🆔 Generated new category ID:', this._id);
    }

    next();
  } catch (error) {
    console.error('❌ Category pre-save error:', error);
    next(error);
  }
});

// Indexes
categorySchema.index({ name: 1 }, { unique: true });
categorySchema.index({ isActive: 1 });
categorySchema.index({ displayOrder: 1 });

module.exports = mongoose.model('Category', categorySchema);
