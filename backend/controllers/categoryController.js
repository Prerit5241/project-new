const Category = require('../models/Category');
const { getNextId } = require('../models/Counter');

// ===========================
// CREATE CATEGORY
// ===========================
exports.createCategory = async (req, res) => {
  try {
    const { name, description, iconName, iconClass } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    // Prevent duplicate names
    const existingCategory = await Category.findOne({ name: new RegExp(`^${name}$`, 'i') });
    if (existingCategory) {
      return res.status(400).json({ success: false, message: 'Category with this name already exists.' });
    }

    const nextId = await getNextId('categories');

    const category = new Category({
      _id: nextId,
      name: name.trim(),
      description: description?.trim() || '',
      iconName: iconName?.trim() || '',
      iconClass: iconClass?.trim() || ''
    });

    const savedCategory = await category.save();

    // ✅ Explicitly convert mongoose doc to plain object so all fields show up
    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      data: savedCategory.toObject()
    });
  } catch (err) {
    console.error('Create category error:', err);
    res.status(500).json({ success: false, message: 'Server error creating category.' });
  }
};

// ===========================
// GET ALL CATEGORIES
// ===========================
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: categories });
  } catch (err) {
    console.error('Get all categories error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching categories.' });
  }
};

// ===========================
// GET CATEGORY BY ID
// ===========================
exports.getCategoryById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const category = await Category.findById(id).lean();

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    res.json({ success: true, data: category });
  } catch (err) {
    console.error('Get category by ID error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching category.' });
  }
};

// ===========================
// UPDATE CATEGORY
// ===========================
exports.updateCategory = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const updates = { ...req.body };

    delete updates._id; // prevent changing id

    if (updates.hasOwnProperty('iconName')) {
      updates.iconName = updates.iconName?.trim() || '';
    }
    if (updates.hasOwnProperty('iconClass')) {
      updates.iconClass = updates.iconClass?.trim() || '';
    }

    const updatedCategory = await Category.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
      lean: true
    });

    if (!updatedCategory) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    res.json({ success: true, message: 'Category updated successfully.', data: updatedCategory });
  } catch (err) {
    console.error('Update category error:', err);
    res.status(500).json({ success: false, message: 'Server error updating category.' });
  }
};

// ===========================
// DELETE CATEGORY
// ===========================
exports.deleteCategory = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ success: false, message: 'Server error deleting category.' });
  }
};
