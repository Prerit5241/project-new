/* backend/controllers/analyticsController.js */
const Product   = require("../models/Product");
const User      = require("../models/User");
const Order     = require("../models/Order");       // (stub or real model)
const Category  = require("../models/Category");
const Activity  = require("../models/Activity");    // ✅ ADDED

/* ───────── DASHBOARD ANALYTICS ───────────────────────── */
exports.getDashboardAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    const [
      totalProducts,
      totalUsers,
      totalCategories,
      recentUsers,
      topProducts,
      topCategories
    ] = await Promise.all([
      Product.countDocuments(),
      User.countDocuments(),
      Category.countDocuments(),
      User.find({ createdAt: { $gte: daysAgo } }).countDocuments(),
      Product.find().sort({ views: -1 }).limit(5).populate("category"),
      Category.aggregate([
        { $lookup: { from: "products", localField: "_id", foreignField: "category", as: "products" } },
        { $project: { name: 1, productCount: { $size: "$products" }, sales: { $sum: "$products.sold" } } },
        { $sort: { productCount: -1 } },
        { $limit: 5 }
      ])
    ]);

    /* compare with previous period (mock numbers for orders/revenue) */
    const prevStart = new Date(daysAgo);
    prevStart.setDate(prevStart.getDate() - parseInt(days));
    const previousUsers = await User.find({
      createdAt: { $gte: prevStart, $lt: daysAgo }
    }).countDocuments();

    const mockOrders          = Math.floor(Math.random() * 100) + 50;
    const mockRevenue         = Math.floor(Math.random() * 10_000) + 5_000;
    const mockPrevOrders      = Math.floor(Math.random() * 80) + 40;
    const mockPrevRevenue     = Math.floor(Math.random() * 8_000) + 4_000;

    const pct = (now, prev) => (prev > 0 ? (((now - prev) / prev) * 100).toFixed(1) : 0);

    const analyticsData = {
      revenue: { total: mockRevenue, change: +pct(mockRevenue, mockPrevRevenue) },
      orders:  { total: mockOrders,  change: +pct(mockOrders,  mockPrevOrders)  },
      users:   { active: recentUsers, total: totalUsers, change: +pct(recentUsers, previousUsers) },
      products:{ total: totalProducts, change: 0 },
      averageOrderValue: mockRevenue / mockOrders,
      conversionRate:    (mockOrders / (recentUsers || 1)) * 100,
      customerSatisfaction: 4.2 + Math.random() * 0.7,
      topCategories: topCategories.map(c => ({
        name: c.name,
        sales: c.sales || Math.floor(Math.random() * 50) + 10,
        revenue: (c.sales || Math.floor(Math.random() * 50) + 10) * (Math.random() * 100 + 50)
      })),
      topProducts: topProducts.map(p => ({
        _id: p._id,
        title: p.title,
        price: p.price,
        sales: Math.floor(Math.random() * 30) + 5
      })),
      recentActivity: [
        { type:"order",  message:"New order received", time:"5 minutes ago",  value:"$125.00" },
        { type:"user",   message:"New user registered", time:"12 minutes ago" },
        { type:"product",message:'Product "Web Development Course" was purchased', time:"25 minutes ago", value:"$89.99" },
        { type:"order",  message:"Order #1234 was completed", time:"1 hour ago", value:"$299.99" },
        { type:"user",   message:"User completed profile setup", time:"2 hours ago" }
      ]
    };

    res.status(200).json({ success:true, data:analyticsData });
  } catch (error) {
    console.error("Dashboard analytics error:", error);
    res.status(500).json({ success:false, message:"Failed to fetch dashboard analytics", error:error.message });
  }
};

/* ───────── REVENUE (stub) ───────────────────────────── */
exports.getRevenueAnalytics = async (req, res) => {
  try {
    res.status(200).json({
      success:true,
      data:{ message:"Revenue analytics endpoint - implement based on your order model" }
    });
  } catch (error) {
    res.status(500).json({ success:false, message:"Failed to fetch revenue analytics", error:error.message });
  }
};

/* ───────── USER BREAKDOWN ───────────────────────────── */
exports.getUserAnalytics = async (req, res) => {
  try {
    const userStats = await User.aggregate([
      { $group: {
          _id:null,
          totalUsers:{ $sum:1 },
          adminUsers:{ $sum:{ $cond:[{ $eq:["$role","admin"] },1,0] } },
          instructors:{ $sum:{ $cond:[{ $eq:["$role","instructor"] },1,0] } },
          students:{ $sum:{ $cond:[{ $eq:["$role","user"] },1,0] } }
      }}
    ]);
    res.status(200).json({ success:true, data:userStats[0] || { totalUsers:0, adminUsers:0, instructors:0, students:0 } });
  } catch (error) {
    res.status(500).json({ success:false, message:"Failed to fetch user analytics", error:error.message });
  }
};

/* ───────── TRACK USER REGISTRATION ───────────────────── */
exports.trackRegister = async (req, res, next) => {
  try {
    const { userId, userName, userRole } = req.body;
    await Activity.create({
      userId,
      userName,
      userRole,
      type: "user_register",
      message: `${userName} registered`,
      details: { via: "web" }
    });
    res.status(201).json({ success:true });
  } catch (err) {
    next(err);
  }
};

/* ───────── PRODUCT SNAPSHOT ─────────────────────────── */
exports.getProductAnalytics = async (req, res) => {
  try {
    const productStats = await Product.aggregate([
      { $group:{
          _id:null,
          totalProducts:{ $sum:1 },
          featuredProducts:{ $sum:{ $cond:["$featured",1,0] } },
          averagePrice:{ $avg:"$price" },
          totalStock:{ $sum:"$stock" }
      }}
    ]);
    res.status(200).json({ success:true, data:productStats[0] || { totalProducts:0, featuredProducts:0, averagePrice:0, totalStock:0 } });
  } catch (error) {
    res.status(500).json({ success:false, message:"Failed to fetch product analytics", error:error.message });
  }
};
