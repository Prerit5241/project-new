// controllers/subCategoryController.js
const SubCategory = require('../models/SubCategory');
const Category = require('../models/Category');

// ===========================
// CREATE SUBCATEGORY (ADMIN ONLY)
// ===========================
exports.createSubCategory = async (req, res) => {
  try {
    const { name, category, description } = req.body;

    // Validate required fields
    if (!name || !category) {
      return res
        .status(400)
        .json({ success: false, message: 'Name and category are required.' });
    }

    // Validate name length
    if (name.length > 100) {
      return res
        .status(400)
        .json({ success: false, message: 'Subcategory name cannot exceed 100 characters.' });
    }

    // Check if parent category exists
    const parentCategory = await Category.findById(Number(category));
    if (!parentCategory) {
      return res
        .status(404)
        .json({ success: false, message: 'Parent category not found.' });
    }

    // Check duplicate subcategory name under the same category (case-insensitive)
    const existingSub = await SubCategory.findOne({
      name: new RegExp(`^${name.trim()}$`, 'i'),
      category: Number(category),
    });
    if (existingSub) {
      return res
        .status(400)
        .json({ success: false, message: 'This subcategory already exists in the category.' });
    }

    // ✅ REMOVED: Manual ID generation - let SubCategory model handle it
    // const nextId = await getNextId('subcategories');

    // ✅ NEW: Let SubCategory model auto-generate ID
    const subCategory = new SubCategory({
      // No _id field - SubCategory model will auto-generate using counter
      name: name.trim(),
      category: Number(category),
      description: description?.trim() || '',
    });

    await subCategory.save(); // Gets ID from 301+ range automatically

    // Populate category info for response
    await subCategory.populate('category', 'name _id');

    console.log('✅ SubCategory created with ID:', subCategory._id);

    res.status(201).json({
      success: true,
      message: 'Subcategory created successfully.',
      data: subCategory,
    });
  } catch (err) {
    console.error('Create subcategory error:', err);
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error.',
        errors: errors
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Server error creating subcategory.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ===========================
// GET ALL SUBCATEGORIES (PUBLIC)
// ===========================
exports.getAllSubCategories = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 50 } = req.query;
    const query = {};

    // Filter by category if provided
    if (category) {
      query.category = Number(category);
    }

    // Search by name if provided
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Pagination
    const skip = (page - 1) * limit;
    const [subCategories, total] = await Promise.all([
      SubCategory.find(query)
        .populate('category', 'name _id')
        .sort({ name: 1 })
        .skip(skip)
        .limit(Number(limit)),
      SubCategory.countDocuments(query)
    ]);

    res.json({ 
      success: true, 
      data: subCategories,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasMore: page < Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Get subcategories error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching subcategories.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ===========================
// GET SUBCATEGORIES BY CATEGORY (PUBLIC)
// ===========================
exports.getSubCategoriesByCategory = async (req, res) => {
  try {
    const categoryId = Number(req.params.categoryId);

    // Check if parent category exists
    const parentCategory = await Category.findById(categoryId);
    if (!parentCategory) {
      return res
        .status(404)
        .json({ success: false, message: 'Parent category not found.' });
    }

    const subCategories = await SubCategory.find({ category: categoryId })
      .populate('category', 'name _id')
      .sort({ name: 1 });

    res.json({ 
      success: true, 
      data: subCategories,
      category: parentCategory 
    });
  } catch (err) {
    console.error('Get subcategories by category error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching subcategories.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ===========================
// GET SUBCATEGORY BY ID (PUBLIC)
// ===========================
exports.getSubCategoryById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid subcategory ID format.' 
      });
    }

    const subCategory = await SubCategory.findById(id).populate('category', 'name _id');

    if (!subCategory) {
      return res.status(404).json({ success: false, message: 'Subcategory not found.' });
    }

    res.json({ success: true, data: subCategory });
  } catch (err) {
    console.error('Get subcategory by ID error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching subcategory.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ===========================
// UPDATE SUBCATEGORY (ADMIN ONLY)
// ===========================
exports.updateSubCategory = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const updates = { ...req.body };

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid subcategory ID format.' 
      });
    }

    // Prevent changing _id
    delete updates._id;

    // Trim string fields
    if (updates.name) {
      updates.name = updates.name.trim();
      
      // Validate name length
      if (updates.name.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Subcategory name cannot exceed 100 characters.'
        });
      }
    }

    if (updates.description) {
      updates.description = updates.description.trim();
    }

    // If category is being updated, check if it exists
    if (updates.category) {
      const categoryId = Number(updates.category);
      const categoryExists = await Category.findById(categoryId);
      if (!categoryExists) {
        return res.status(404).json({ 
          success: false, 
          message: 'New parent category not found.' 
        });
      }
      updates.category = categoryId;

      // Check for duplicate name in new category
      if (updates.name) {
        const existingSub = await SubCategory.findOne({
          _id: { $ne: id }, // Exclude current subcategory
          name: new RegExp(`^${updates.name}$`, 'i'),
          category: categoryId,
        });
        if (existingSub) {
          return res.status(400).json({ 
            success: false, 
            message: 'This subcategory name already exists in the target category.' 
          });
        }
      }
    }

    // If only name is being updated, check for duplicates in same category
    if (updates.name && !updates.category) {
      const currentSub = await SubCategory.findById(id);
      if (currentSub) {
        const existingSub = await SubCategory.findOne({
          _id: { $ne: id }, // Exclude current subcategory
          name: new RegExp(`^${updates.name}$`, 'i'),
          category: currentSub.category,
        });
        if (existingSub) {
          return res.status(400).json({ 
            success: false, 
            message: 'This subcategory name already exists in the category.' 
          });
        }
      }
    }

    const updatedSubCategory = await SubCategory.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate('category', 'name _id');

    if (!updatedSubCategory) {
      return res.status(404).json({ success: false, message: 'Subcategory not found.' });
    }

    console.log('✅ SubCategory updated:', id);

    res.json({ 
      success: true, 
      message: 'Subcategory updated successfully.', 
      data: updatedSubCategory 
    });
  } catch (err) {
    console.error('Update subcategory error:', err);
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error.',
        errors: errors
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Server error updating subcategory.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ===========================
// DELETE SUBCATEGORY (ADMIN ONLY)
// ===========================
exports.deleteSubCategory = async (req, res) => {
  try {
    const id = Number(req.params.id);
    
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid subcategory ID format.' 
      });
    }

    // ✅ Check if subcategory is being used by products
    const Product = require('../models/Product');
    const productCount = await Product.countDocuments({ subCategory: id });
    
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete subcategory. It is currently used by ${productCount} product(s). Please reassign or delete those products first.`
      });
    }

    const deletedSubCategory = await SubCategory.findByIdAndDelete(id);

    if (!deletedSubCategory) {
      return res.status(404).json({ success: false, message: 'Subcategory not found.' });
    }

    console.log('✅ SubCategory deleted:', id);

    res.json({ 
      success: true, 
      message: 'Subcategory deleted successfully.',
      data: { deletedId: id }
    });
  } catch (err) {
    console.error('Delete subcategory error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error deleting subcategory.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ===========================
// GET SUBCATEGORY STATISTICS (ADMIN)
// ===========================
exports.getSubCategoryStats = async (req, res) => {
  try {
    const Product = require('../models/Product');
    
    const [
      totalSubCategories,
      subCategoriesWithProducts
    ] = await Promise.all([
      SubCategory.countDocuments(),
      SubCategory.aggregate([
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: 'subCategory',
            as: 'products'
          }
        },
        {
          $addFields: {
            productCount: { $size: '$products' }
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'categoryInfo'
          }
        },
        {
          $unwind: '$categoryInfo'
        },
        {
          $project: {
            _id: 1,
            name: 1,
            category: '$categoryInfo.name',
            productCount: 1
          }
        },
        { $sort: { productCount: -1 } }
      ])
    ]);

    const stats = {
      totalSubCategories,
      subCategoriesWithProducts: subCategoriesWithProducts.filter(sub => sub.productCount > 0).length,
      emptySubCategories: subCategoriesWithProducts.filter(sub => sub.productCount === 0).length,
      topSubCategories: subCategoriesWithProducts.slice(0, 10)
    };

    res.json({ success: true, data: stats });
  } catch (err) {
    console.error('Get subcategory stats error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error getting statistics.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ===========================
// SEARCH SUBCATEGORIES (PUBLIC)
// ===========================
exports.searchSubCategories = async (req, res) => {
  try {
    const { q: searchTerm, category, limit = 20 } = req.query;

    if (!searchTerm || searchTerm.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search term must be at least 2 characters long.'
      });
    }

    const query = {
      name: { $regex: searchTerm.trim(), $options: 'i' }
    };

    // Filter by category if provided
    if (category) {
      query.category = Number(category);
    }

    const subCategories = await SubCategory.find(query)
      .populate('category', 'name _id')
      .sort({ name: 1 })
      .limit(Number(limit));

    res.json({
      success: true,
      data: subCategories,
      searchTerm: searchTerm.trim(),
      count: subCategories.length
    });
  } catch (err) {
    console.error('Search subcategories error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error searching subcategories.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = {
  createSubCategory: exports.createSubCategory,
  getAllSubCategories: exports.getAllSubCategories,
  getSubCategoriesByCategory: exports.getSubCategoriesByCategory,
  getSubCategoryById: exports.getSubCategoryById,
  updateSubCategory: exports.updateSubCategory,
  deleteSubCategory: exports.deleteSubCategory,
  getSubCategoryStats: exports.getSubCategoryStats,
  searchSubCategories: exports.searchSubCategories
};
