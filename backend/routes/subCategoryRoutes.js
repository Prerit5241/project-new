// routes/subCategoryRoutes.js
const express = require('express');
const router = express.Router();
const subCategoryController = require('../controllers/subCategoryController');
const auth = require('../middlewares/auth');

// Role-based authorization helper
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Insufficient permissions.' 
    });
  };
}

// ===== PUBLIC ROUTES =====

// Get all subcategories (with filtering, pagination, search)
router.get('/', subCategoryController.getAllSubCategories);

// Get subcategories by parent category
router.get('/category/:categoryId', subCategoryController.getSubCategoriesByCategory);

// Search subcategories
router.get('/search', subCategoryController.searchSubCategories);

// Get subcategory by ID
router.get('/:id', subCategoryController.getSubCategoryById);

// ===== ADMIN ROUTES =====

// Create new subcategory (admin only)
router.post('/', auth, authorizeRoles('admin'), subCategoryController.createSubCategory);

// Update subcategory (admin only)
router.put('/:id', auth, authorizeRoles('admin'), subCategoryController.updateSubCategory);

// Delete subcategory (admin only)
router.delete('/:id', auth, authorizeRoles('admin'), subCategoryController.deleteSubCategory);

// Get subcategory statistics (admin only)
router.get('/admin/stats', auth, authorizeRoles('admin'), subCategoryController.getSubCategoryStats);

// ===== BULK OPERATIONS (ADMIN ONLY) =====

// Bulk delete subcategories
router.post('/admin/bulk-delete', auth, authorizeRoles('admin'), async (req, res) => {
  try {
    const { subCategoryIds } = req.body;
    
    if (!Array.isArray(subCategoryIds) || subCategoryIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'SubCategory IDs array is required'
      });
    }

    const SubCategory = require('../models/SubCategory');
    const Product = require('../models/Product');
    
    // Check if any subcategories are being used by products
    const numericIds = subCategoryIds.map(id => Number(id));
    const usedSubCategories = await Product.find({ 
      subCategory: { $in: numericIds } 
    }).distinct('subCategory');

    if (usedSubCategories.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete subcategories. ${usedSubCategories.length} subcategory(ies) are currently used by products.`,
        usedSubCategories
      });
    }

    const result = await SubCategory.deleteMany({ 
      _id: { $in: numericIds }
    });

    res.json({
      success: true,
      message: `${result.deletedCount} subcategories deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk delete subcategories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete subcategories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Bulk move subcategories to different parent category
router.put('/admin/bulk-move', auth, authorizeRoles('admin'), async (req, res) => {
  try {
    const { subCategoryIds, newCategoryId } = req.body;
    
    if (!Array.isArray(subCategoryIds) || subCategoryIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'SubCategory IDs array is required'
      });
    }

    if (!newCategoryId) {
      return res.status(400).json({
        success: false,
        message: 'New category ID is required'
      });
    }

    // Verify new category exists
    const Category = require('../models/Category');
    const category = await Category.findById(Number(newCategoryId));
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Target category not found'
      });
    }

    const SubCategory = require('../models/SubCategory');
    const numericIds = subCategoryIds.map(id => Number(id));
    
    const result = await SubCategory.updateMany(
      { _id: { $in: numericIds } },
      { $set: { category: Number(newCategoryId) } }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} subcategories moved to ${category.name}`,
      modifiedCount: result.modifiedCount,
      targetCategory: category.name
    });
  } catch (error) {
    console.error('Bulk move subcategories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to move subcategories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===== UTILITY ROUTES =====

// Get subcategories with product counts
router.get('/admin/with-counts', auth, authorizeRoles('admin'), async (req, res) => {
  try {
    const SubCategory = require('../models/SubCategory');
    
    const subCategoriesWithCounts = await SubCategory.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'subCategory',
          as: 'products'
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
          description: 1,
          category: '$categoryInfo.name',
          categoryId: '$categoryInfo._id',
          productCount: { $size: '$products' },
          createdAt: 1,
          updatedAt: 1
        }
      },
      { $sort: { productCount: -1, name: 1 } }
    ]);

    res.json({
      success: true,
      data: subCategoriesWithCounts,
      count: subCategoriesWithCounts.length
    });
  } catch (error) {
    console.error('Get subcategories with counts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subcategories with counts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get unused subcategories (no products)
router.get('/admin/unused', auth, authorizeRoles('admin'), async (req, res) => {
  try {
    const SubCategory = require('../models/SubCategory');
    
    const unusedSubCategories = await SubCategory.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'subCategory',
          as: 'products'
        }
      },
      {
        $match: {
          'products': { $size: 0 }
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
          description: 1,
          category: '$categoryInfo.name',
          categoryId: '$categoryInfo._id',
          createdAt: 1
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    res.json({
      success: true,
      data: unusedSubCategories,
      count: unusedSubCategories.length,
      message: unusedSubCategories.length === 0 ? 'All subcategories are in use' : `${unusedSubCategories.length} unused subcategories found`
    });
  } catch (error) {
    console.error('Get unused subcategories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unused subcategories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Export subcategories data (admin only)
router.get('/admin/export', auth, authorizeRoles('admin'), async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    const SubCategory = require('../models/SubCategory');
    
    const subCategories = await SubCategory.find()
      .populate('category', 'name')
      .select('name description category createdAt updatedAt')
      .sort({ name: 1 })
      .lean();

    const exportData = subCategories.map(sub => ({
      id: sub._id,
      name: sub.name,
      description: sub.description,
      category: sub.category?.name || 'Unknown',
      categoryId: sub.category?._id || null,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt
    }));

    if (format.toLowerCase() === 'csv') {
      // Convert to CSV format
      const csv = [
        'ID,Name,Description,Category,Category ID,Created At,Updated At',
        ...exportData.map(item => 
          `${item.id},"${item.name}","${item.description || ''}","${item.category}",${item.categoryId},"${item.createdAt}","${item.updatedAt}"`
        )
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=subcategories.csv');
      res.send(csv);
    } else {
      res.json({
        success: true,
        data: exportData,
        count: exportData.length,
        exportedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Export subcategories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export subcategories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===== PARAMETER VALIDATION MIDDLEWARE =====

// Validate numeric ID parameter
router.param('id', (req, res, next, id) => {
  const numericId = Number(id);
  if (isNaN(numericId) || numericId <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid subcategory ID format'
    });
  }
  req.params.id = numericId; // Ensure it's numeric
  next();
});

// Validate numeric category ID parameter
router.param('categoryId', (req, res, next, categoryId) => {
  const numericId = Number(categoryId);
  if (isNaN(numericId) || numericId <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid category ID format'
    });
  }
  req.params.categoryId = numericId; // Ensure it's numeric
  next();
});

module.exports = router;
