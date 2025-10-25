const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../utils/jwt");

module.exports = function(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, msg: "No token" });
    }

    const decoded = jwt.verify(token, getJwtSecret());
    
    // ✅ Fix: Ensure proper user ID handling
    const userId = decoded.userId || decoded.id;
    
    req.user = {
      userId: Number(userId), // ✅ Convert to Number for database compatibility
      id: Number(userId),     // ✅ Also provide id for compatibility
      email: decoded.email,
      role: decoded.role,
      name: decoded.name
    };
    
    console.log('✅ JWT decoded user:', req.user);
    next();
  } catch (err) {
    console.error('❌ JWT verification failed:', err);
    return res.status(401).json({ success: false, msg: "Token invalid" });
  }
};

module.exports.authorize = function(roles = []) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, msg: "Forbidden" });
    }
    next();
  };
};
