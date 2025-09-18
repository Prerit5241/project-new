// routes/categoryRoutes.js
const express           = require("express");
const router            = express.Router();
const categoryController = require("../controllers/categoryController");
const Course            = require("../models/Course");          // NEW
const auth              = require("../middlewares/auth");

/* ───────── Role-based guard ───────── */
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) return next();
    return res.status(403).json({ msg: "Access denied" });
  };
}

/* ───────── PUBLIC ROUTES ───────── */
router.get("/",      categoryController.getAllCategories);
router.get("/:id",   categoryController.getCategoryById);

/* NEW ➜  GET /api/categories/:id/courses  */
router.get("/:id/courses", async (req, res) => {
  const catId = Number(req.params.id);           // 10, 11, …
  try {
    const courses = await Course
      .find({ category: catId })
      .populate("category", "name");             // optional
    res.json({ success: true, data: courses });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      msg: "Failed to fetch courses for category",
      error: err.message
    });
  }
});

/* ───────── ADMIN-ONLY ROUTES ───────── */
router.post(  "/",     auth, authorizeRoles("admin"), categoryController.createCategory);
router.put(   "/:id",  auth, authorizeRoles("admin"), categoryController.updateCategory);
router.delete("/:id",  auth, authorizeRoles("admin"), categoryController.deleteCategory);

module.exports = router;
