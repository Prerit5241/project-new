// routes/productRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");

// ✅ Destructure all controller functions
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require("../controllers/productController");

// Public: Get all products
router.get("/", getProducts);

// Public: Get product by ID
router.get("/:id", getProductById);

// Admin: Create product
router.post("/", auth, createProduct);

// Admin: Update product
router.put("/:id", auth, updateProduct);

// Admin: Delete product
router.delete("/:id", auth, deleteProduct);

module.exports = router;
