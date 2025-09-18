// controllers/courseController.js
const Course       = require('../models/Course');
const Category     = require('../models/Category');
const { getNextId } = require('../models/Counter');

/* ─────────────── CREATE COURSE ─────────────── */
exports.createCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      price     = 0,
      duration  = 0,
      level     = 'beginner',
      status    = 'draft',
      imageUrl,
      instructor          // may come from body or auth middleware
    } = req.body;

    /* required-field checks */
    if (!title)        return res.status(400).json({ msg: 'Title is required' });
    if (!description)  return res.status(400).json({ msg: 'Description is required' });
    if (!category)     return res.status(400).json({ msg: 'Category is required' });

    /* validate category exists */
    const cat = await Category.findById(Number(category));
    if (!cat)
      return res.status(400).json({ msg: 'Invalid category ID—category does not exist' });

    /* resolve instructor */
    const instructorId =
      instructor               ? Number(instructor)
      : req.user?.id           ? req.user.id
      : null;

    if (!instructorId)
      return res.status(400).json({ msg: 'Instructor is required' });

    /* create course */
    const nextId = await getNextId('courses');
    const course = new Course({
      _id        : nextId,
      title,
      description,
      category   : Number(category),
      price      : Number(price),
      duration   : Number(duration),
      level,
      status,
      imageUrl,
      instructor : instructorId
    });

    const saved = await course.save();
    await saved.populate('category', 'name'); // attach category name only

    return res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error('Create course error:', err);
    return res.status(500).json({ msg: 'Error creating course', error: err.message });
  }
};

/* ─────────────── GET ALL COURSES ─────────────── */
exports.getCourses = async (_req, res) => {
  try {
    const courses = await Course.find().populate('category', 'name');
    return res.json({ success: true, data: courses });
  } catch (err) {
    console.error('Get courses error:', err);
    return res.status(500).json({ msg: 'Error fetching courses', error: err.message });
  }
};

/* ─────────────── GET COURSE BY ID ─────────────── */
exports.getCourseById = async (req, res) => {
  try {
    const id     = Number(req.params.id);
    const course = await Course.findOne({ _id: id }).populate('category', 'name');

    if (!course)
      return res.status(404).json({ success: false, msg: 'Course not found' });

    return res.json({ success: true, data: course });
  } catch (err) {
    console.error('Get course by ID error:', err);
    return res.status(500).json({ msg: 'Error fetching course', error: err.message });
  }
};

/* ─────────────── UPDATE COURSE ─────────────── */
exports.updateCourse = async (req, res) => {
  try {
    const courseId = Number(req.params.id);
    const updates  = { ...req.body };           // shallow copy

    /* validate & coerce category if present */
    if (updates.category) {
      const cat = await Category.findById(Number(updates.category));
      if (!cat)
        return res.status(400).json({ msg: 'Invalid category ID—category does not exist' });
      updates.category = Number(updates.category);
    }

    /* coerce numeric fields */
    if (updates.price)      updates.price      = Number(updates.price);
    if (updates.duration)   updates.duration   = Number(updates.duration);
    if (updates.instructor) updates.instructor = Number(updates.instructor);

    const updated = await Course.findOneAndUpdate(
      { _id: courseId },
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('category', 'name');

    if (!updated)
      return res.status(404).json({ success: false, msg: 'Course not found' });

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Update course error:', err);
    return res.status(500).json({ msg: 'Error updating course', error: err.message });
  }
};

/* ─────────────── DELETE COURSE ─────────────── */
exports.deleteCourse = async (req, res) => {
  try {
    const courseId = Number(req.params.id);
    const deleted  = await Course.findOneAndDelete({ _id: courseId });

    if (!deleted)
      return res.status(404).json({ success: false, msg: 'Course not found' });

    return res.json({ success: true, msg: 'Course deleted successfully' });
  } catch (err) {
    console.error('Delete course error:', err);
    return res.status(500).json({ msg: 'Error deleting course', error: err.message });
  }
};

/* ─────────────── COURSE CONTENT DELIVERY ─────────────── */

// ✅ Get Course Modules (for enrolled students)
exports.getCourseModules = async (req, res) => {
  try {
    const courseId = Number(req.params.id);
    const studentId = req.user.userId;

    console.log('📚 Getting modules for course:', courseId, 'student:', studentId);

    // Check if student is enrolled
    const User = require('../models/User');
    const student = await User.findById(studentId);
    
    if (!student || !student.isEnrolledIn(courseId)) {
      return res.status(403).json({
        success: false,
        message: "Not enrolled in this course"
      });
    }

    // Get course with modules
    const course = await Course.findById(courseId)
      .populate('category', 'name')
      .populate('instructor', 'name email')
      .lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    // Get enrollment progress
    const enrollment = student.getEnrollment(courseId);

    res.json({
      success: true,
      course: {
        _id: course._id,
        title: course.title,
        description: course.description,
        instructor: course.instructor,
        category: course.category,
        duration: course.duration,
        level: course.level
      },
      modules: course.modules || [],
      enrollment: {
        enrolledAt: enrollment.enrolledAt,
        progress: enrollment.progress,
        status: enrollment.status,
        pricePaid: enrollment.price
      }
    });

  } catch (err) {
    console.error('❌ Error getting course modules:', err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ✅ Get Specific Module - FIXED VERSION
exports.getModule = async (req, res) => {
  try {
    const courseId = Number(req.params.id);
    const moduleIndex = Number(req.params.moduleIndex);
    const studentId = req.user.userId;

    console.log('📖 Getting module:', moduleIndex, 'for course:', courseId, 'student:', studentId);

    // Check enrollment
    const User = require('../models/User');
    const student = await User.findById(studentId);
    
    if (!student || !student.isEnrolledIn(courseId)) {
      return res.status(403).json({
        success: false,
        message: "Not enrolled in this course"
      });
    }

    // ✅ USE .lean() to get plain JS objects
    const course = await Course.findById(courseId)
      .populate('instructor', 'name email')
      .lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    const module = course.modules[moduleIndex];
    if (!module) {
      return res.status(404).json({
        success: false,
        message: "Module not found"
      });
    }

    // ✅ Clean response - only return what you need
    res.json({
      success: true,
      module: {
        title: module.title,
        description: module.description,
        lessons: module.lessons || [],
        moduleIndex
      },
      course: {
        _id: course._id,
        title: course.title,
        instructor: course.instructor
      }
    });

  } catch (err) {
    console.error('❌ Error getting module:', err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ✅ Get Specific Lesson
// ✅ Get Specific Lesson - FIXED VERSION
exports.getLesson = async (req, res) => {
  try {
    const courseId = Number(req.params.id);
    const moduleIndex = Number(req.params.moduleIndex);
    const lessonIndex = Number(req.params.lessonIndex);
    const studentId = req.user.userId;

    console.log('📝 Getting lesson:', lessonIndex, 'module:', moduleIndex, 'course:', courseId);

    // Check enrollment
    const User = require('../models/User');
    const student = await User.findById(studentId);
    
    if (!student || !student.isEnrolledIn(courseId)) {
      return res.status(403).json({
        success: false,
        message: "Not enrolled in this course"
      });
    }

    // ✅ Use .lean() to get plain JS objects
    const course = await Course.findById(courseId)
      .populate('instructor', 'name email')
      .lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    const module = course.modules[moduleIndex];
    if (!module) {
      return res.status(404).json({
        success: false,
        message: "Module not found"
      });
    }

    const lesson = module.lessons[lessonIndex];
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found"
      });
    }

    // ✅ Clean response - only return what you need
    res.json({
      success: true,
      lesson: {
        title: lesson.title,
        content: lesson.content,
        videoUrl: lesson.videoUrl,
        duration: lesson.duration,
        contentType: lesson.contentType,
        lessonIndex,
        moduleIndex
      },
      module: {
        title: module.title,
        description: module.description
      },
      course: {
        _id: course._id,
        title: course.title,
        instructor: course.instructor
      }
    });

  } catch (err) {
    console.error('❌ Error getting lesson:', err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


// ✅ Mark Lesson as Complete
exports.markLessonComplete = async (req, res) => {
  try {
    const courseId = Number(req.params.id);
    const moduleIndex = Number(req.params.moduleIndex);
    const lessonIndex = Number(req.params.lessonIndex);
    const studentId = req.user.userId;

    console.log('✅ Marking lesson complete:', lessonIndex, 'module:', moduleIndex, 'course:', courseId);

    // Check enrollment
    const User = require('../models/User');
    const student = await User.findById(studentId);
    
    if (!student || !student.isEnrolledIn(courseId)) {
      return res.status(403).json({
        success: false,
        message: "Not enrolled in this course"
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    // Validate module and lesson exist
    const module = course.modules[moduleIndex];
    if (!module) {
      return res.status(404).json({
        success: false,
        message: "Module not found"
      });
    }

    const lesson = module.lessons[lessonIndex];
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found"
      });
    }

    // TODO: Add lesson completion tracking to User model
    // For now, we'll just return success
    res.json({
      success: true,
      message: "Lesson marked as complete",
      lesson: {
        title: lesson.title,
        moduleIndex,
        lessonIndex
      }
    });

  } catch (err) {
    console.error('❌ Error marking lesson complete:', err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ✅ Get Course Progress Summary
exports.getCourseProgress = async (req, res) => {
  try {
    const courseId = Number(req.params.id);
    const studentId = req.user.userId;

    console.log('📊 Getting course progress for course:', courseId, 'student:', studentId);

    // Check enrollment
    const User = require('../models/User');
    const student = await User.findById(studentId);
    
    if (!student || !student.isEnrolledIn(courseId)) {
      return res.status(403).json({
        success: false,
        message: "Not enrolled in this course"
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    const enrollment = student.getEnrollment(courseId);

    // Calculate total lessons
    let totalLessons = 0;
    if (course.modules && course.modules.length > 0) {
      totalLessons = course.modules.reduce((total, module) => {
        return total + (module.lessons ? module.lessons.length : 0);
      }, 0);
    }

    res.json({
      success: true,
      progress: {
        courseId,
        courseTitle: course.title,
        enrolledAt: enrollment.enrolledAt,
        progress: enrollment.progress,
        status: enrollment.status,
        pricePaid: enrollment.price,
        totalModules: course.modules ? course.modules.length : 0,
        totalLessons,
        completedLessons: 0 // TODO: Implement lesson tracking
      }
    });

  } catch (err) {
    console.error('❌ Error getting course progress:', err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* ─────────────── COURSE CONTENT CREATION ─────────────── */

// ✅ Add Module to Course
exports.addModule = async (req, res) => {
  try {
    const courseId = Number(req.params.id);
    const { title, description } = req.body;

    console.log('📝 Adding module to course:', courseId);

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Module title is required"
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    // Add new module to course
    const newModule = {
      title,
      description: description || "",
      lessons: []
    };

    course.modules.push(newModule);
    await course.save();

    console.log('✅ Module added successfully');

    res.status(201).json({
      success: true,
      message: "Module added successfully",
      module: newModule,
      totalModules: course.modules.length
    });

  } catch (err) {
    console.error('❌ Error adding module:', err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ✅ Add Lesson to Module - FIXED VERSION WITH contentType
exports.addLesson = async (req, res) => {
  try {
    const courseId = Number(req.params.id);
    const moduleIndex = Number(req.params.moduleIndex);
    const { title, content, videoUrl, duration, contentType } = req.body;

    console.log('📝 Adding lesson to course:', courseId, 'module:', moduleIndex);
    console.log('📝 Request body:', req.body);

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Lesson title is required"
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    const module = course.modules[moduleIndex];
    if (!module) {
      return res.status(404).json({
        success: false,
        message: "Module not found"
      });
    }

    // ✅ Add new lesson to module with required contentType
    const newLesson = {
      title,
      content: content || "",
      videoUrl: videoUrl || "",
      duration: duration || 0,
      contentType: contentType || "video"  // ✅ Add required field with default
    };

    module.lessons.push(newLesson);
    await course.save();

    console.log('✅ Lesson added successfully');

    res.status(201).json({
      success: true,
      message: "Lesson added successfully",
      lesson: newLesson,
      totalLessons: module.lessons.length
    });

  } catch (err) {
    console.error('❌ Error adding lesson:', err);
    console.error('❌ Error stack:', err.stack);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV !== 'production' ? err.message : undefined
    });
  }
};

// ✅ Update Module
exports.updateModule = async (req, res) => {
  try {
    const courseId = Number(req.params.id);
    const moduleIndex = Number(req.params.moduleIndex);
    const { title, description } = req.body;

    console.log('📝 Updating module:', moduleIndex, 'in course:', courseId);

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    const module = course.modules[moduleIndex];
    if (!module) {
      return res.status(404).json({
        success: false,
        message: "Module not found"
      });
    }

    // Update module
    if (title) module.title = title;
    if (description !== undefined) module.description = description;

    await course.save();

    console.log('✅ Module updated successfully');

    res.json({
      success: true,
      message: "Module updated successfully",
      module
    });

  } catch (err) {
    console.error('❌ Error updating module:', err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ✅ Delete Module
exports.deleteModule = async (req, res) => {
  try {
    const courseId = Number(req.params.id);
    const moduleIndex = Number(req.params.moduleIndex);

    console.log('🗑️ Deleting module:', moduleIndex, 'from course:', courseId);

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    if (moduleIndex >= course.modules.length || moduleIndex < 0) {
      return res.status(404).json({
        success: false,
        message: "Module not found"
      });
    }

    // Remove module
    course.modules.splice(moduleIndex, 1);
    await course.save();

    console.log('✅ Module deleted successfully');

    res.json({
      success: true,
      message: "Module deleted successfully",
      totalModules: course.modules.length
    });

  } catch (err) {
    console.error('❌ Error deleting module:', err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
