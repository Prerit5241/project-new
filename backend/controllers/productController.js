const Product = require("../models/Product");
const { getNextId } = require("../models/Counter");
const Category = require("../models/Category");
const SubCategory = require("../models/SubCategory");

// ==================== CREATE PRODUCT ====================
exports.createProduct = async (req, res) => {
  try {
    let { title, description, price, images, category, subCategory, stock, brand, featured } = req.body;

    console.log("CREATE PRODUCT - Incoming request body:", req.body);

    if (!title || !description || price === undefined || !category) {
      return res.status(400).json({ msg: "Title, description, price, and category are required" });
    }

    // ---------- CATEGORY HANDLING ----------
    if (typeof category === "string") {
      let categoryDoc = await Category.findOne({ name: category.trim() });
      if (!categoryDoc) {
        const nextCategoryId = await getNextId("categories");
        categoryDoc = await new Category({ _id: nextCategoryId, name: category.trim() }).save();
      }
      category = categoryDoc._id;
    } else {
      const categoryDoc = await Category.findById(category);
      if (!categoryDoc) return res.status(400).json({ msg: "Category not found" });
    }

    // ---------- SUBCATEGORY HANDLING ----------
    if (subCategory) {
      if (typeof subCategory === "string") {
        let subCategoryDoc = await SubCategory.findOne({ name: subCategory.trim(), category });
        if (!subCategoryDoc) {
          const nextSubCategoryId = await getNextId("subcategories");
          subCategoryDoc = await new SubCategory({
            _id: nextSubCategoryId,
            name: subCategory.trim(),
            category
          }).save();
        }
        subCategory = subCategoryDoc._id;
      } else {
        const subCategoryDoc = await SubCategory.findOne({ _id: subCategory, category });
        if (!subCategoryDoc) return res.status(400).json({ msg: "Subcategory does not belong to category" });
      }
    }

    const nextProductId = await getNextId("products");

    const product = new Product({
      _id: nextProductId,
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      images: images || [],
      category,
      subCategory: subCategory || undefined,
      stock: stock || 0,
      brand: brand || "",
      featured: featured || false
    });

    const savedProduct = await product.save();

    // populate category/subCategory to ensure frontend can read them
    await savedProduct.populate([
      { path: "category", select: "name description" },
      { path: "subCategory", select: "name description" }
    ]);

    console.log("CREATE PRODUCT - Sending to frontend:", savedProduct);

    res.status(201).json(savedProduct);
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).json({ msg: "Server error creating product", error: err.message });
  }
};

// ==================== GET ALL PRODUCTS WITH PAGINATION ====================
exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;
    const skip = (page - 1) * limit;

    // console.log(`GET PRODUCTS - Page: ${page}, Limit: ${limit}, Skip: ${skip}`);

    const products = await Product.find()
      .populate("category", "name description")
      .populate("subCategory", "name description")
      .skip(skip)
      .limit(limit);

    const mapped = products.map(p => ({
      _id: p._id,
      title: p.title || "Untitled Product",
      description: p.description || "",
      price: Number(p.price) || 0,
      images: p.images || [],
      category: p.category || null,
      subCategory: p.subCategory || null,
      stock: p.stock || 0,
      brand: p.brand || "",
      featured: p.featured || false
    }));


    res.json({ data: mapped });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ msg: "Server error fetching products", error: err.message });
  }
};

// ==================== GET PRODUCT BY ID ====================
exports.getProductById = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    console.log("GET PRODUCT BY ID - Incoming ID:", productId);

    if (isNaN(productId)) return res.status(400).json({ msg: "Invalid product ID" });

    const product = await Product.findOne({ _id: productId })
      .populate("category", "name description")
      .populate("subCategory", "name description");

    if (!product) return res.status(404).json({ msg: "Product not found" });

    const mappedProduct = {
      _id: product._id,
      title: product.title || "Untitled Product",
      description: product.description || "",
      price: Number(product.price) || 0,
      images: product.images || [],
      category: product.category || null,
      subCategory: product.subCategory || null,
      stock: product.stock || 0,
      brand: product.brand || "",
      featured: product.featured || false
    };

    console.log("GET PRODUCT BY ID - Sending to frontend:", mappedProduct);

    res.json(mappedProduct);
  } catch (err) {
    console.error("Error fetching product by ID:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// ==================== UPDATE PRODUCT ====================
exports.updateProduct = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    console.log("UPDATE PRODUCT - Incoming ID:", productId);
    console.log("UPDATE PRODUCT - Incoming body:", req.body);

    if (isNaN(productId)) return res.status(400).json({ msg: "Invalid product ID" });

    const updates = { ...req.body };
    if (updates.price !== undefined) updates.price = Number(updates.price);

    if (updates.category) {
      if (typeof updates.category === "string") {
        let categoryDoc = await Category.findOne({ name: updates.category.trim() });
        if (!categoryDoc) {
          const nextCategoryId = await getNextId("categories");
          categoryDoc = await new Category({ _id: nextCategoryId, name: updates.category.trim() }).save();
        }
        updates.category = categoryDoc._id;
      } else {
        const categoryDoc = await Category.findById(updates.category);
        if (!categoryDoc) return res.status(400).json({ msg: "Category not found" });
      }
    }

    if (updates.subCategory) {
      if (typeof updates.subCategory === "string") {
        let subCategoryDoc = await SubCategory.findOne({ name: updates.subCategory.trim(), category: updates.category });
        if (!subCategoryDoc) {
          const nextSubCategoryId = await getNextId("subcategories");
          subCategoryDoc = await new SubCategory({ _id: nextSubCategoryId, name: updates.subCategory.trim(), category: updates.category }).save();
        }
        updates.subCategory = subCategoryDoc._id;
      }
    }

    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId },
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate("category", "name description")
      .populate("subCategory", "name description");

    if (!updatedProduct) return res.status(404).json({ msg: "Product not found" });

    console.log("UPDATE PRODUCT - Sending to frontend:", updatedProduct);

    res.json(updatedProduct);
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ msg: "Server error updating product", error: err.message });
  }
};

// ==================== DELETE PRODUCT ====================
exports.deleteProduct = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    console.log("DELETE PRODUCT - Incoming ID:", productId);

    if (isNaN(productId)) return res.status(400).json({ msg: "Invalid product ID" });

    const deletedProduct = await Product.findOneAndDelete({ _id: productId });
    if (!deletedProduct) return res.status(404).json({ msg: "Product not found" });

    console.log("DELETE PRODUCT - Deleted product ID:", productId);

    res.json({ msg: "Product deleted successfully" });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ msg: "Server error deleting product", error: err.message });
  }
};
