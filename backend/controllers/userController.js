// E:\college project\backend\controllers\userController.js
const User = require("../models/User");
const { getNextId } = require("../models/Counter");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const ActivityTracker = require("../middlewares/activityTracker");
const { getJwtSecret } = require("../utils/jwt");

// Helper: Generate JWT token for user
function generateToken(user) {
  return jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    getJwtSecret(),
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
    const nextUserId = await getNextId("users");

    const user = new User({
      _id: nextUserId,
      name,
      email: lowerEmail,
      password: hashedPassword,
      role: "student",
    });

    await user.save();
    const token = generateToken(user);
    const sanitizedUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };

    try {
      if (ActivityTracker?.logUserRegistration) {
        await ActivityTracker.logUserRegistration(user, req);
      }
    } catch (logError) {
      console.error("Registration activity log failed:", logError);
    }

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: { user: sanitizedUser, token },
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
    const tokenUserId = req.user.userId;
    const normalizedUserId = Number(tokenUserId);
    const userId = Number.isNaN(normalizedUserId) ? tokenUserId : normalizedUserId;

    const allowedFields = ["name", "email"];
    const updates = {};
    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        const value = typeof req.body[field] === "string" ? req.body[field].trim() : req.body[field];
        if (value !== undefined) {
          updates[field] = value;
        }
      }
    });

    // Remove password or disallowed fields explicitly
    delete updates.password;

    const existingUser = await User.findById(userId).select("name email role");
    if (!existingUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const changeLog = [];
    Object.keys(updates).forEach((field) => {
      const previousRaw = existingUser[field];
      const currentRaw = updates[field];

      if (currentRaw === previousRaw) {
        delete updates[field];
      } else {
        changeLog.push({
          field,
          previous: previousRaw === undefined || previousRaw === null ? "" : String(previousRaw),
          current: currentRaw === undefined || currentRaw === null ? "" : String(currentRaw),
        });
      }
    });

    if (!Object.keys(updates).length) {
      return res.json({
        success: true,
        message: "No profile changes detected.",
        data: existingUser,
      });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (changeLog.length) {
      const previousIdentifier = existingUser.name || existingUser.email || "User";
      const updatedIdentifier = updatedUser.name || updatedUser.email || previousIdentifier;
      const actorRole = existingUser.role || updatedUser.role || "student";

      const changeSummaries = changeLog.map((entry) => {
        const label = entry.field.charAt(0).toUpperCase() + entry.field.slice(1);
        const previousDisplay = entry.previous || "—";
        const currentDisplay = entry.current || "—";
        return `${label}: "${previousDisplay}" → "${currentDisplay}"`;
      });

      let message;
      const nameChange = changeLog.find((entry) => entry.field === "name");
      if (changeLog.length === 1 && nameChange) {
        const previousName = nameChange.previous || previousIdentifier;
        const newName = nameChange.current || updatedIdentifier;
        message = `${previousName} updated profile name to "${newName}"`;
      } else {
        message = `${previousIdentifier} updated profile${changeSummaries.length ? ` (${changeSummaries.join("; ")})` : ""}`;
      }

      await ActivityTracker.logActivity(
        "profile_update",
        updatedUser._id || userId,
        updatedIdentifier,
        actorRole,
        message,
        {
          email: updatedUser.email,
          changes: changeLog,
        },
        req
      );
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

// ================= UPDATE USER COINS (ADMIN ONLY) =================
exports.updateUserCoins = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (typeof amount !== 'number' || isNaN(amount)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount provided',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Initialize coins to 0 if not set
    if (user.coins === undefined) {
      user.coins = 0;
    }

    // Update coins (can be positive or negative)
    user.coins += amount;
    
    // Ensure coins don't go below 0
    if (user.coins < 0) {
      user.coins = 0;
    }

    await user.save();

    // Log the activity
    try {
      const activityType = 'coin_update';
      const activityMessage = `Coins ${amount >= 0 ? 'added' : 'subtracted'}: ${Math.abs(amount)}`;
      const activityDetails = {
        amount: amount,
        newValue: user.coins.toString(),
        updatedBy: req.user.userId,
        action: amount >= 0 ? 'add' : 'subtract',
        previousBalance: (user.coins - amount).toString()
      };

      await ActivityTracker.logActivity(
        activityType,                  // type
        id,                           // userId
        user.name || 'User',          // userName
        user.role || 'user',          // userRole
        activityMessage,              // message
        activityDetails,              // details
        req                          // request object for IP and User-Agent
      );
    } catch (logError) {
      console.error('Failed to log activity (non-critical):', logError);
      // Don't fail the request if logging fails
    }

    res.status(200).json({
      success: true,
      message: 'User coins updated successfully',
      data: {
        userId: user._id,
        newBalance: user.coins,
      },
    });
  } catch (error) {
    console.error('Error updating user coins:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
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
