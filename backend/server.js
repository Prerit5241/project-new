require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const authMiddleware = require("./middlewares/auth"); // JWT auth

// ===== Connect to MongoDB =====
connectDB();

const mongoose = require('mongoose');
mongoose.set('strictPopulate', false);

const app = express();

// ===== Register models =====
require("./models/Category");
require("./models/Product");
require("./models/Course");
require("./models/User");
require("./models/Activity"); // ✅ Activity tracking model

// ===== Helper Functions =====
// Helper function to validate ObjectId
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// ===== Middleware =====

// ✅ CORS: allow localhost + LAN IPs dynamically
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow Postman/curl
      
      // allow localhost/127.0.0.1
      if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
      
      // allow any 10.x.x.x LAN IP
      if (/^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin)) return callback(null, true);
      
      // allow any 192.168.x.x LAN IP
      if (/^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin)) return callback(null, true);

      // allow frontend development servers
      if (/^http:\/\/localhost:3000$/.test(origin)) return callback(null, true);
      if (/^http:\/\/127\.0\.0\.1:3000$/.test(origin)) return callback(null, true);

      console.warn(`❌ CORS blocked origin: ${origin}`);
      return callback(new Error(`❌ CORS policy: Origin ${origin} is not allowed`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID']
  })
);

// Parse JSON bodies with increased limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ JSON parse error handler (NEW ADDITION)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('❌ JSON Parse Error:', err.message);
    return res.status(400).json({
      success: false,
      message: "Invalid JSON format in request body",
      error: 'INVALID_JSON'
    });
  }
  next();
});

// ✅ Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`📡 ${timestamp} - ${req.method} ${req.path} - IP: ${req.ip || req.connection.remoteAddress}`);
  next();
});

// ✅ ENHANCED ID VALIDATION - Handles numeric IDs and ObjectIds correctly
app.param('id', (req, res, next, id) => {
  // Numeric IDs: products, categories, subcategories, users, courses
  if (
    req.path.includes('/products/') ||
    req.path.includes('/categories/') ||
    req.path.includes('/subcategories/') ||
    req.path.includes('/users/') ||
    req.path.includes('/courses/') ||
    req.path.includes('/student/')
  ) {
    const numericId = Number(id);
    if (isNaN(numericId) || numericId <= 0) {
      console.warn(`⚠️ Invalid Numeric ID: ${id}`);
      return res.status(400).json({
        success: false,
        message: `Invalid ID format: ${id}. Expected positive number.`,
        error: 'INVALID_NUMERIC_ID'
      });
    }
  }
  // ObjectId: only for things like activities, analytics, maybe orders/logs
  else {
    if (!isValidObjectId(id)) {
      console.warn(`⚠️ Invalid ObjectId: ${id}`);
      return res.status(400).json({
        success: false,
        message: `Invalid ID format: ${id}. Expected valid ObjectId.`,
        error: 'INVALID_OBJECT_ID'
      });
    }
  }
  next();
});

// ===== Routes =====

// ✅ Authentication routes
app.use("/api/auth", require("./routes/auth")); // Auth routes (login, register, logout)

// ✅ User management routes
app.use("/api/users", require("./routes/userRoutes")); // user/admin management
app.use("/api/student", require("./routes/studentRoutes")); // student-specific routes
app.use("/api/instructor", require("./routes/instructorRoutes")); // instructor-specific routes

// ✅ E-commerce routes
app.use("/api/products", require("./routes/productRoutes")); // product management
app.use("/api/cart", require("./routes/cartRoutes")); // cart management
app.use("/api/categories", require("./routes/categoryRoutes")); // category management
app.use("/api/subcategories", require("./routes/subCategoryRoutes")); // subcategory management

// Learning management routes
app.use("/api/courses", require("./routes/courseRoutes")); // course management

// Coin management routes
app.use("/api/coins", require("./routes/coinRoutes")); // coin management

// ===== Analytics and reporting routes =====
app.use("/api/analytics", require("./routes/analyticsRoutes")); // Analytics dashboard
app.use("/api/activities", require("./routes/activityRouter")); // Activity tracking and logs

// ===== Base health check =====
app.get("/", (req, res) => {
  res.json({ 
    success: true, 
    message: "✅ College E-commerce & LMS API is running...", 
    timestamp: new Date().toISOString(),
    routes: [
      "/api/auth",
      "/api/users", 
      "/api/student",
      "/api/instructor",
      "/api/products",
      "/api/categories",
      "/api/subcategories", 
      "/api/courses",
      "/api/coins",
      "/api/analytics",
      "/api/activities"
    ]
  });
});

// ===== API Info endpoint =====
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "College E-commerce & LMS API",
    version: "1.0.0",
    features: [
      "User Authentication & Authorization",
      "Product & Category Management", 
      "Course & Learning Management",
      "Activity Tracking & Analytics",
      "Role-based Access Control"
    ],
    endpoints: {
      auth: "/api/auth (login, register, logout, profile)",
      users: "/api/users (user management)",
      products: "/api/products (e-commerce)",
      coins: "/api/coins (coin management)",
      courses: "/api/courses (learning management)",
      analytics: "/api/analytics (business insights)",
      activities: "/api/activities (activity logs)"
    }
  });
});

// ===== 404 Handler =====
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    success: false, 
    message: "Route not found",
    requestedPath: req.path,
    method: req.method,
    availableRoutes: [
      "/api/auth",
      "/api/users", 
      "/api/student",
      "/api/instructor", 
      "/api/products",
      "/api/categories",
      "/api/subcategories",
      "/api/courses",
      "/api/analytics", 
      "/api/activities"
    ]
  });
});

// ===== Global Error Handler =====
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", {
    message: err.message || err,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  res.status(err.status || 500).json({ 
    success: false, 
    message: process.env.NODE_ENV === 'production' ? 'Server error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// ===== Start Server =====
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://192.168.10.78:${PORT}`);
  console.log(`📡 Local access: http://localhost:${PORT}`);
  console.log(`🌐 Network access: http://192.168.10.78:${PORT}`);
  console.log(`📊 Analytics: http://192.168.10.78:${PORT}/api/analytics`);
  console.log(`📋 Activities: http://192.168.10.78:${PORT}/api/activities`);
  console.log(`🏥 Health check: http://192.168.10.78:${PORT}/`);
  console.log(`📚 API info: http://192.168.10.78:${PORT}/api`);
  console.log(`🛡️ Global ID validation: ENABLED`);
  console.log(`🛡️ JSON parse error handling: ENABLED`);
});
