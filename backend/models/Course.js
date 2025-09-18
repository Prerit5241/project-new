const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// ===== Lesson Schema =====
const lessonSchema = new Schema({
  title: { type: String, required: true, trim: true },
  contentType: { type: String, enum: ['video', 'article', 'quiz'], required: true },
  contentUrl: { type: String, trim: true },
  duration: { type: Number, default: 0 },
  description: { type: String, trim: true }
}, { _id: false });

// ===== Module Schema =====
const moduleSchema = new Schema({
  title: { type: String, required: true, trim: true },
  lessons: [lessonSchema]
}, { _id: false });

// ===== Course Schema =====
const courseSchema = new Schema({
  _id: { type: Number, required: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, trim: true, maxlength: 5000 },
  
  // ✅ FIXED: Use Number instead of ObjectId
  category: {
    type: Number,           // ✅ Changed to Number
    ref: 'Category',        // ✅ Still references Category model
    required: true
  },
  
  level: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'advanced'], 
    default: 'beginner' 
  },
  
  status: { 
    type: String, 
    enum: ['draft', 'published', 'archived'], 
    default: 'draft' 
  },
  
  imageUrl: { type: String, trim: true },
  price: { type: Number, required: true, min: 0, default: 0 },
  duration: { type: Number, default: 0 },
  
  // Keep existing fields
  language: { 
    type: String, 
    enum: ['JavaScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'Go', 'Other']
  },
  
  instructor: {
    type: Number,
    ref: 'User',
    required: true
  },
  
  modules: [moduleSchema],
  
  ratings: {
    average: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 }
  },
  
  enrollmentCount: { type: Number, default: 0 }
  
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
