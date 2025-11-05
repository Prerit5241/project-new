const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ======================
// Custom Validators
// ======================
const validators = {
  // Validate course ID
  courseIdValidator: {
    validator: function(v) {
      return Number.isInteger(v) && v > 0;
    },
    message: 'Course ID must be a positive integer'
  },
  
  // Validate price
  priceValidator: {
    validator: function(v) {
      return typeof v === 'number' && v >= 0 && Number.isFinite(v);
    },
    message: 'Price must be a valid non-negative number'
  },
  
  // Validate progress
  progressValidator: {
    validator: function(v) {
      return Number.isInteger(v) && v >= 0 && v <= 100;
    },
    message: 'Progress must be an integer between 0 and 100'
  },

  // Validate enrollment status
  statusValidator: {
    validator: function(v) {
      return ['active', 'completed', 'cancelled'].includes(v);
    },
    message: 'Status must be active, completed, or cancelled'
  }
};

// ======================
// Enrollment Subdocument Schema
// ======================
const EnrollmentSchema = new mongoose.Schema({
  courseId: {
    type: Number,
    required: [true, 'Course ID is required for enrollment'],
    validate: validators.courseIdValidator
    // ✅ REMOVED: index: true (to prevent duplicate with separate index)
  },
  enrolledAt: {
    type: Date,
    required: [true, 'Enrollment date is required'],
    default: Date.now,
    validate: {
      validator: function(v) {
        return v <= new Date();
      },
      message: 'Enrollment date cannot be in the future'
    }
  },
  price: {
    type: Number,
    required: [true, 'Course price is required for enrollment'],
    validate: validators.priceValidator
  },
  progress: {
    type: Number,
    default: 0,
    validate: validators.progressValidator
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'completed', 'cancelled'],
      message: 'Status must be active, completed, or cancelled'
    },
    default: 'active',
    validate: validators.statusValidator
  },
  completedLessons: [{
    moduleIndex: {
      type: Number,
      required: true,
      min: 0
    },
    lessonIndex: {
      type: Number,
      required: true,
      min: 0
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastAccessed: {
    type: Date,
    default: Date.now
  }
}, { 
  _id: false,
  timestamps: false
});

// Enrollment Schema-level validation
EnrollmentSchema.pre('validate', function(next) {
  // Ensure price is set when creating enrollment
  if (this.isNew && this.price === undefined) {
    this.invalidate('price', 'Price is required for new enrollment');
  }
  
  // Ensure courseId is set
  if (this.isNew && !this.courseId) {
    this.invalidate('courseId', 'Course ID is required for new enrollment');
  }
  
  next();
});

// ======================
// User Schema
// ======================
const userSchema = new mongoose.Schema({
  _id: { 
    type: Number,
    required: true
  },
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
    // ✅ REMOVED: index: true (to prevent duplicate with separate index)
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'], 
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
    // ✅ REMOVED: index: true (to prevent duplicate with separate index)
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: {
      values: ['student', 'admin', 'instructor'],
      message: 'Role must be student, admin, or instructor'
    },
    default: 'student'
  },
  enrolledCourses: {
    type: [EnrollmentSchema],
    default: [],
    validate: {
      validator: function(enrollments) {
        // Check for duplicate course enrollments
        const courseIds = enrollments.map(e => e.courseId);
        return courseIds.length === new Set(courseIds).size;
      },
      message: 'Cannot have duplicate course enrollments'
    }
  },
  coins: {
    type: Number,
    default: 0,
    min: [0, 'Coins cannot be negative'],
    get: v => Math.round(v),
    set: v => Math.round(v)
  },
  profile: {
    avatar: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
        },
        message: 'Avatar must be a valid image URL'
      }
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      trim: true
    },
    dateOfBirth: {
      type: Date,
      validate: {
        validator: function(v) {
          if (!v) return true;
          const eighteenYearsAgo = new Date();
          eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
          return v <= eighteenYearsAgo;
        },
        message: 'Must be at least 18 years old'
      }
    }
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    language: {
      type: String,
      enum: ['en', 'es', 'fr', 'de', 'zh'],
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  }
}, {
  _id: false,
  timestamps: true,
  collection: 'users'
});

// ======================
// ✅ FIXED: Indexes for Performance (No Duplicates)
// ======================
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ name: 1 }); // ✅ ADDED: Separate name index
userSchema.index({ role: 1 });
userSchema.index({ 'enrolledCourses.courseId': 1 });
userSchema.index({ 'enrolledCourses.status': 1 });
userSchema.index({ 'enrolledCourses.enrolledAt': -1 });
userSchema.index({ createdAt: -1 });

// ======================
// ✅ FIXED: Pre-save Middlewares
// ======================
userSchema.pre('save', async function(next) {
  // Auto-increment _id for new users
  if (this.isNew) {
    try {
      const lastUser = await this.constructor.findOne({}, {}, { sort: { '_id': -1 } });
      this._id = lastUser ? lastUser._id + 1 : 1;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// ✅ ENHANCED: Password hashing middleware with better error handling
userSchema.pre('save', async function(next) {
  // Only hash password if it has been modified (or is new)
  if (!this.isModified('password')) {
    console.log('🔍 Password not modified, skipping hash');
    return next();
  }
  
  try {
    console.log('🔍 Hashing password for user:', this.email);
    console.log('🔍 Original password length:', this.password?.length);
    
    // Check if already hashed
    if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$') || this.password.startsWith('$2y$')) {
      console.log('🔍 Password already appears to be hashed, skipping');
      return next();
    }
    
    const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 10;
    const hashedPassword = await bcrypt.hash(this.password, saltRounds);
    
    console.log('🔍 Password hashed successfully');
    console.log('🔍 Hash length:', hashedPassword.length);
    console.log('🔍 Hash starts with:', hashedPassword.substring(0, 10));
    
    // ✅ CRITICAL: Immediate verification
    const verification = await bcrypt.compare(this.password, hashedPassword);
    if (!verification) {
      console.error('❌ Hash verification failed immediately!');
      return next(new Error('Password hashing verification failed'));
    }
    
    this.password = hashedPassword;
    next();
  } catch (error) {
    console.error('❌ Password hashing error:', error);
    next(error);
  }
});

userSchema.pre('save', function(next) {
  // Update lastAccessed for active enrollments
  this.enrolledCourses.forEach(enrollment => {
    if (enrollment.status === 'active') {
      enrollment.lastAccessed = new Date();
    }
  });
  next();
});

// ======================
// ✅ ENHANCED: Instance Methods
// ======================
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    console.log('🔍 Comparing password for user:', this.email);
    console.log('🔍 Candidate password provided:', !!candidatePassword);
    console.log('🔍 Stored hash length:', this.password?.length);
    console.log('🔍 Hash format check:', this.password?.startsWith('$2'));
    
    const result = await bcrypt.compare(candidatePassword, this.password);
    console.log('🔍 Password comparison result:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Password comparison error:', error);
    return false;
  }
};

userSchema.methods.enrollInCourse = async function(courseId, price, options = {}) {
  const numericCourseId = Number(courseId);
  const numericPrice = Number(price);
  const { session } = options;

  try {
    // Comprehensive validation
    if (!Number.isInteger(numericCourseId) || numericCourseId <= 0) {
      throw new Error('Invalid course ID: must be a positive integer');
    }
    
    if (typeof numericPrice !== 'number' || numericPrice < 0 || !Number.isFinite(numericPrice)) {
      throw new Error('Invalid price: must be a valid non-negative number');
    }

    // Check for existing enrollment
    const existingEnrollment = this.enrolledCourses.find(
      enrollment => enrollment.courseId === numericCourseId
    );
    
    if (existingEnrollment) {
      if (existingEnrollment.status === 'cancelled') {
        // Reactivate cancelled enrollment
        existingEnrollment.status = 'active';
        existingEnrollment.lastAccessed = new Date();
        await this.save(options);
        return existingEnrollment;
      } else {
        throw new Error('Already enrolled in this course');
      }
    }

    // Create new enrollment
    const newEnrollment = {
      courseId: numericCourseId,
      enrolledAt: new Date(),
      price: numericPrice,
      progress: 0,
      status: 'active',
      completedLessons: [],
      lastAccessed: new Date()
    };

    // Add to enrolledCourses array
    this.enrolledCourses.push(newEnrollment);

    // Save with options (which may include session)
    await this.save(options);
    
    // Return the newly created enrollment
    return this.enrolledCourses.find(e => e.courseId === numericCourseId);
    
  } catch (error) {
    console.error('Error in enrollInCourse:', error);
    throw error; // Re-throw to be handled by the caller
  }
};

userSchema.methods.isEnrolledIn = function(courseId) {
  const numericCourseId = Number(courseId);
  return this.enrolledCourses.some(
    enrollment => enrollment.courseId === numericCourseId && enrollment.status === 'active'
  );
};

userSchema.methods.getEnrollment = function(courseId) {
  const numericCourseId = Number(courseId);
  return this.enrolledCourses.find(
    enrollment => enrollment.courseId === numericCourseId
  );
};

userSchema.methods.updateCourseProgress = async function(courseId, progress) {
  const numericCourseId = Number(courseId);
  const numericProgress = Number(progress);
  
  if (!Number.isInteger(numericProgress) || numericProgress < 0 || numericProgress > 100) {
    throw new Error('Progress must be an integer between 0 and 100');
  }

  const enrollment = this.enrolledCourses.find(
    enrollment => enrollment.courseId === numericCourseId
  );

  if (!enrollment) {
    throw new Error('Not enrolled in this course');
  }

  if (enrollment.status !== 'active') {
    throw new Error('Cannot update progress for inactive enrollment');
  }

  enrollment.progress = numericProgress;
  enrollment.lastAccessed = new Date();
  
  // Auto-complete course if 100% progress
  if (numericProgress >= 100) {
    enrollment.status = 'completed';
  }

  await this.save();
  return enrollment;
};

userSchema.methods.markLessonComplete = async function(courseId, moduleIndex, lessonIndex) {
  const enrollment = this.getEnrollment(courseId);
  
  if (!enrollment) {
    throw new Error('Not enrolled in this course');
  }

  if (enrollment.status !== 'active') {
    throw new Error('Cannot complete lessons for inactive enrollment');
  }

  // Check if lesson already completed
  const isAlreadyCompleted = enrollment.completedLessons.some(
    lesson => lesson.moduleIndex === moduleIndex && lesson.lessonIndex === lessonIndex
  );

  if (!isAlreadyCompleted) {
    enrollment.completedLessons.push({
      moduleIndex,
      lessonIndex,
      completedAt: new Date()
    });
    enrollment.lastAccessed = new Date();
    await this.save();
  }

  return enrollment;
};

userSchema.methods.getEnrolledCoursesWithDetails = async function() {
  try {
    const Course = require('./Course');
    
    if (!this.enrolledCourses || this.enrolledCourses.length === 0) {
      return [];
    }

    // Get active course IDs
    const activeCourseIds = this.enrolledCourses
      .filter(enrollment => enrollment.status === 'active')
      .map(enrollment => enrollment.courseId);

    if (activeCourseIds.length === 0) {
      return [];
    }

    // Fetch course details with population
    const courses = await Course.find({ 
      _id: { $in: activeCourseIds } 
    })
    .populate('instructor', 'name email profile.avatar')
    .populate('category', 'name')
    .lean();

    // Combine course data with enrollment data
    const coursesWithEnrollment = courses.map(course => {
      const enrollment = this.enrolledCourses.find(
        e => e.courseId === course._id
      );
      
      return {
        ...course,
        enrollment: {
          enrolledAt: enrollment?.enrolledAt,
          progress: enrollment?.progress || 0,
          status: enrollment?.status || 'active',
          pricePaid: enrollment?.price,
          completedLessons: enrollment?.completedLessons || [],
          lastAccessed: enrollment?.lastAccessed
        }
      };
    });

    return coursesWithEnrollment;
  } catch (error) {
    console.error('Error getting enrolled courses with details:', error);
    throw new Error('Failed to fetch enrolled courses');
  }
};

userSchema.methods.getEnrollmentStats = function() {
  if (!this.enrolledCourses || this.enrolledCourses.length === 0) {
    return {
      total: 0,
      active: 0,
      completed: 0,
      cancelled: 0,
      averageProgress: 0,
      totalLessonsCompleted: 0,
      recentActivity: null
    };
  }

  const stats = {
    total: this.enrolledCourses.length,
    active: 0,
    completed: 0,
    cancelled: 0,
    averageProgress: 0,
    totalLessonsCompleted: 0,
    recentActivity: null
  };

  let totalProgress = 0;
  let totalLessonsCompleted = 0;
  let mostRecentActivity = null;

  this.enrolledCourses.forEach(enrollment => {
    stats[enrollment.status]++;
    totalProgress += enrollment.progress || 0;
    totalLessonsCompleted += enrollment.completedLessons?.length || 0;
    
    if (enrollment.lastAccessed && 
        (!mostRecentActivity || enrollment.lastAccessed > mostRecentActivity)) {
      mostRecentActivity = enrollment.lastAccessed;
    }
  });

  stats.averageProgress = Math.round(totalProgress / this.enrolledCourses.length);
  stats.totalLessonsCompleted = totalLessonsCompleted;
  stats.recentActivity = mostRecentActivity;
  
  return stats;
};

userSchema.methods.cancelEnrollment = async function(courseId) {
  const enrollment = this.getEnrollment(courseId);
  
  if (!enrollment) {
    throw new Error('Not enrolled in this course');
  }

  if (enrollment.status === 'cancelled') {
    throw new Error('Enrollment already cancelled');
  }

  enrollment.status = 'cancelled';
  enrollment.lastAccessed = new Date();
  
  await this.save();
  return enrollment;
};

// ======================
// Static Methods
// ======================
userSchema.statics.findWithEnrollments = function(userId, populateOptions = {}) {
  return this.findById(userId)
    .populate('enrolledCourses.courseId', populateOptions.courseFields || 'title description price')
    .select('-password');
};

userSchema.statics.getEnrollmentAnalytics = async function() {
  const pipeline = [
    {
      $unwind: '$enrolledCourses'
    },
    {
      $group: {
        _id: '$enrolledCourses.status',
        count: { $sum: 1 },
        averageProgress: { $avg: '$enrolledCourses.progress' }
      }
    }
  ];

  return await this.aggregate(pipeline);
};

// ======================
// Virtual Properties
// ======================
userSchema.virtual('totalEnrolledCourses').get(function() {
  return this.enrolledCourses ? this.enrolledCourses.length : 0;
});

userSchema.virtual('activeEnrolledCourses').get(function() {
  if (!this.enrolledCourses) return 0;
  return this.enrolledCourses.filter(e => e.status === 'active').length;
});

userSchema.virtual('completedCourses').get(function() {
  if (!this.enrolledCourses) return 0;
  return this.enrolledCourses.filter(e => e.status === 'completed').length;
});

userSchema.virtual('fullName').get(function() {
  return this.name;
});

// ======================
// Schema Options
// ======================
userSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

userSchema.set('toObject', { 
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

// ======================
// Error Handling
// ======================
userSchema.post('save', function(error, doc, next) {
  if (error.name === 'ValidationError') {
    // Transform validation errors to more user-friendly messages
    const errors = {};
    
    for (const field in error.errors) {
      errors[field] = error.errors[field].message;
    }
    
    const customError = new Error('Validation failed');
    customError.name = 'ValidationError';
    customError.errors = errors;
    customError.isOperational = true;
    
    next(customError);
  } else if (error.code === 11000) {
    // Handle duplicate key errors
    const duplicateError = new Error('Email already exists');
    duplicateError.name = 'DuplicateError';
    duplicateError.isOperational = true;
    
    next(duplicateError);
  } else {
    next(error);
  }
});

module.exports = mongoose.model('User', userSchema);
