// E:\college project\backend\controllers\userController.js
const User = require("../models/User");
const { getNextId } = require("../models/Counter");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Helper: Generate JWT token for user
function generateToken(user) {
  return jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
}

// ========== ADMIN-ONLY: Create a User with Any Role ==========
exports.adminCreateUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
    }

    const lowerEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: lowerEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "A user with this email already exists.",
      });
    }

    const nextUserId = await getNextId("users");
    const hashedPassword = await bcrypt.hash(String(password), 10); // ✅ ensure string

    const allowedRoles = ["student", "instructor", "admin"];
    const finalRole = allowedRoles.includes(role) ? role : "student";

    const user = new User({
      _id: nextUserId,
      name,
      email: lowerEmail,
      password: hashedPassword,
      role: finalRole,
    });

    await user.save();

    return res.status(201).json({
      success: true,
      message: "User created successfully by admin.",
      data: { userId: user._id, role: user.role },
    });
  } catch (err) {
    console.error("Admin create user error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error creating user.",
    });
  }
};

// ========== PUBLIC: Register New Student ==========
// ========== PUBLIC: Register New Student ==========
exports.publicRegister = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
    }

    const lowerEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: lowerEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "A user with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    // ✅ Let MongoDB generate _id automatically - remove manual _id assignment
    const user = new User({
      // _id: nextUserId,  // ❌ REMOVE THIS LINE
      name,
      email: lowerEmail,
      password: hashedPassword,
      role: "student",
    });

    await user.save();
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: { user, token }, // ✅ Return full user object with _id
    });
  } catch (err) {
    console.error("Public registration error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error during registration.",
    });
  }
};


// ========== LOGIN ==========
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isMatch = await bcrypt.compare(String(password), user.password); // ✅ ensure string
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: { userId: user._id, role: user.role, token },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error during login.",
    });
  }
};

// ========== PROFILE ==========
exports.profile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    return res.json({ success: true, data: user });
  } catch (err) {
    console.error("Profile error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching profile.",
    });
  }
};

// ========== UPDATE PROFILE (SELF) ==========
exports.updateProfile = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.password; // handled separately

    const updatedUser = await User.findByIdAndUpdate(req.user.userId, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.json({
      success: true,
      message: "Profile updated successfully.",
      data: updatedUser,
    });
  } catch (err) {
    console.error("Update profile error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error updating profile.",
    });
  }
};

// ========== GET ALL USERS (ADMIN) ==========
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    return res.json({ success: true, data: users });
  } catch (err) {
    console.error("Get all users error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error fetching users.",
    });
  }
};

// ========== GET USER BY ID ==========
exports.getUserById = async (req, res) => {
  try {
    const requestedUserId = Number(req.params.id);
    if (req.user.role !== "admin" && req.user.userId !== requestedUserId) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const user = await User.findById(requestedUserId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.json({ success: true, data: user });
  } catch (err) {
    console.error("Get user by ID error:", err);
    return res.status(500).json({ success: false, message: "Server error fetching user." });
  }
};

// ========== UPDATE USER BY ID ==========
exports.updateUserById = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const updates = { ...req.body };

    if (req.user.role !== "admin") delete updates.role;
    delete updates.password;

    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.json({
      success: true,
      message: "User updated successfully.",
      data: updatedUser,
    });
  } catch (err) {
    console.error("Update user by ID error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error updating user.",
    });
  }
};

// ========== DELETE USER ==========
exports.deleteUserById = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (req.user.role !== "admin" && req.user.userId !== userId) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.json({ success: true, message: "User deleted successfully." });
  } catch (err) {
    console.error("Delete user error:", err);
    return res.status(500).json({ success: false, message: "Server error deleting user." });
  }
};

// ================= GET STUDENT PROFILE =================
exports.getStudentProfile = async (req, res) => {
  try {
    // Convert JWT userId to Number because your schema uses Number
    const userId = Number(req.user.userId);

    const user = await User.findById(userId).select("-password"); // exclude password

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role !== "student") {
      return res.status(403).json({ success: false, message: "Not authorized as student" });
    }

    res.json({ success: true, student: user });
  } catch (err) {
    console.error("❌ Error fetching student:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================= UPDATE STUDENT PROFILE =================
exports.updateStudentProfile = async (req, res) => {
  try {
    const userId = Number(req.user.userId); // JWT userId
    const updates = { ...req.body };

    // Prevent password or role changes
    delete updates.password;
    delete updates.role;

    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select("-password"); // exclude password

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, data: updatedUser });
  } catch (err) {
    console.error("❌ Error updating student profile:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
