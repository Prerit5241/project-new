// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../utils/jwt');
const User = require('../models/User');
const { getNextId } = require('../models/Counter');
const ActivityTracker = require('../middlewares/activityTracker');

// Authentication middleware for protected routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, getJwtSecret(), (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// ✅ ENHANCED Login Route with better debugging
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔍 DEBUG - Login attempt details:');
    console.log('Email:', email);
    console.log('Password provided:', !!password);
    console.log('Password length:', password?.length);
    
    // Input validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }
    
    // Find user
    const user = await User.findOne({ email });
    console.log('🔍 DEBUG - User found:', !!user);
    
    if (!user) {
      console.log('❌ User not found for email:', email);
      
      // Safe logging without ActivityTracker errors
      try {
        if (ActivityTracker && typeof ActivityTracker.log === 'function') {
          await ActivityTracker.log({
            userEmail: email,
            type: 'user_login',
            userName: 'Unknown User',
            userRole: 'unknown',
            message: `Failed login attempt - user not found for ${email}`,
            details: { 
              reason: 'User not found',
              ipAddress: req.ip || req.connection.remoteAddress,
              userAgent: req.get('User-Agent')
            },
            severity: 'medium',
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent')
          });
        }
      } catch (logError) {
        console.log('Failed to log activity:', logError.message);
      }
      
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }
    
    console.log('🔍 DEBUG - User _id:', user._id);
    console.log('🔍 DEBUG - User name field:', user.name);
    console.log('🔍 DEBUG - User role:', user.role);
    console.log('🔍 DEBUG - Stored password length:', user.password?.length);
    console.log('🔍 DEBUG - Stored password starts with:', user.password?.substring(0, 10));
    
    // ✅ ENHANCED: Use the model's comparePassword method for consistency
    let isMatch;
    try {
      console.log('🔍 DEBUG - Using user.comparePassword method...');
      isMatch = await user.comparePassword(password);
    } catch (compareError) {
      console.error('❌ Error using comparePassword method:', compareError);
      // Fallback to direct bcrypt.compare
      console.log('🔍 DEBUG - Falling back to direct bcrypt.compare...');
      isMatch = await bcrypt.compare(password, user.password);
    }
    
    console.log('🔍 DEBUG - Password comparison result:', isMatch);
    
    if (!isMatch) {
      console.log('❌ Password mismatch for user:', email);
      
      // Enhanced debugging for password issues
      try {
        const isHashedFormat = user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$');
        console.log('🔍 DEBUG - Password appears to be hashed:', isHashedFormat);
        
        if (!isHashedFormat) {
          console.log('❌ CRITICAL: Stored password is not hashed! Raw password in database.');
          console.log('🔧 SOLUTION: User needs to reset password or re-register');
        }
        
        // Test if password was stored as plain text (security issue)
        if (password === user.password) {
          console.log('❌ SECURITY ISSUE: Password stored as plain text!');
          console.log('🔧 This user needs password reset to fix hashing issue');
          
          // Auto-fix: Hash the password now (emergency fix)
          console.log('🔧 EMERGENCY FIX: Attempting to hash plain text password...');
          const hashedPassword = await bcrypt.hash(password, 10);
          await User.findByIdAndUpdate(user._id, { password: hashedPassword });
          console.log('✅ Password has been hashed and updated');
          
          // Continue with login since password is now fixed
          isMatch = true;
        }
        
      } catch (debugError) {
        console.error('❌ Debug comparison error:', debugError);
      }
      
      if (!isMatch) {
        // Safe logging without ActivityTracker errors
        try {
          if (ActivityTracker && typeof ActivityTracker.log === 'function') {
            await ActivityTracker.log({
              userId: user._id,
              userEmail: user.email,
              userName: user.name || 'Unknown',
              userRole: user.role || 'student',
              type: 'user_login',
              message: `Failed login attempt - incorrect password for ${user.email}`,
              details: { 
                reason: 'Incorrect password',
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent')
              },
              severity: 'medium',
              ipAddress: req.ip || req.connection.remoteAddress,
              userAgent: req.get('User-Agent')
            });
          }
        } catch (logError) {
          console.log('Failed to log activity:', logError.message);
        }
        
        return res.status(400).json({ success: false, message: 'Invalid credentials' });
      }
    }
    
    // ✅ Success - user authenticated
    const userId = user._id;
    
    if (!userId) {
      console.error('❌ User ID is null or undefined:', userId);
      return res.status(500).json({ success: false, message: 'User ID error' });
    }
    
    console.log('✅ Valid user ID for JWT:', userId);
    
    // Create JWT token with proper user ID
    const payload = {
      userId: userId,
      id: userId, // Also include id for compatibility
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = jwt.sign(payload, getJwtSecret(), { expiresIn: '24h' });

    try {
      if (ActivityTracker && typeof ActivityTracker.logUserLogin === 'function') {
        await ActivityTracker.logUserLogin(user, req);
      } else if (ActivityTracker && typeof ActivityTracker.log === 'function') {
        await ActivityTracker.log({
          userId: user._id,
          userEmail: user.email,
          userName: user.name || 'Unknown',
          userRole: user.role || 'student',
          type: 'user_login',
          message: `Successful login for ${user.email}`,
          details: {
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
          },
          severity: 'low',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
        });
      }
    } catch (logError) {
      console.log('Failed to log successful login:', logError.message);
    }
    
    console.log(`✅ ${user.role || 'student'} login successful:`, user.name || user.email);
    
    res.json({ 
      success: true, 
      token, 
      user: {
        id: userId,
        _id: userId,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    
    // Safe error logging
    try {
      if (ActivityTracker && typeof ActivityTracker.log === 'function') {
        await ActivityTracker.log({
          userEmail: req.body.email || 'unknown',
          type: 'error_occurred',
          userName: 'System',
          userRole: 'system',
          message: `System error during login attempt`,
          details: { 
            errorMessage: error.message,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent')
          },
          severity: 'high',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        });
      }
    } catch (logError) {
      console.error('❌ Failed to log login error:', logError);
    }
    
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// ✅ SIMPLIFIED Registration Route - Let schema handle password hashing
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'student' } = req.body;

    console.log('🔍 DEBUG - Registration details:');
    console.log('Name:', name);
    console.log('Email:', email);
    console.log('Password provided:', !!password);
    console.log('Password length:', password?.length);
    console.log('Role:', role);

    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and password are required' 
      });
    }

    // ✅ FIX: Check name length (from your earlier error)
    if (name.length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name must be at least 2 characters long' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ User already exists with email:', email);
      
      // Safe logging
      try {
        if (ActivityTracker && typeof ActivityTracker.log === 'function') {
          await ActivityTracker.log({
            userEmail: email,
            type: 'user_register',
            userName: name || 'Unknown',
            userRole: role,
            message: `Registration attempt with existing email: ${email}`,
            details: { 
              reason: 'Email already exists',
              ipAddress: req.ip || req.connection.remoteAddress,
              userAgent: req.get('User-Agent')
            },
            severity: 'low',
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent')
          });
        }
      } catch (logError) {
        console.log('Failed to log registration attempt:', logError.message);
      }
      
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Generate next ID
    const nextId = await getNextId('userId');
    console.log('🔍 Generated user ID:', nextId);

    // ✅ SIMPLIFIED: Let schema pre-save middleware handle password hashing
    console.log('🔍 DEBUG - Creating user (schema will handle password hashing)...');
    
    const user = new User({
      _id: nextId,
      name,
      email,
      password, // Raw password - schema will hash it
      role
    });

    console.log('🔍 DEBUG - About to save user...');
    const savedUser = await user.save();
    console.log('✅ User saved with ID:', savedUser._id);
    
    // ✅ Verify the password was hashed correctly
    const isHashedCorrectly = savedUser.password.startsWith('$2');
    console.log('🔍 DEBUG - Password hashed correctly:', isHashedCorrectly);
    
    if (!isHashedCorrectly) {
      console.error('❌ CRITICAL: Password was not hashed by schema middleware!');
      return res.status(500).json({ 
        success: false, 
        message: 'Password security error' 
      });
    }

    // ✅ Log successful registration
    try {
      if (ActivityTracker && typeof ActivityTracker.logUserRegistration === 'function') {
        await ActivityTracker.logUserRegistration(savedUser, req);
      } else if (ActivityTracker && typeof ActivityTracker.log === 'function') {
        await ActivityTracker.log({
          userId: savedUser._id,
          userEmail: savedUser.email,
          userName: savedUser.name,
          userRole: savedUser.role,
          type: 'user_signup',
          message: `New ${role} registered: ${name}`,
          details: { 
            email: savedUser.email,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent')
          },
          severity: 'low',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        });
      }
    } catch (logError) {
      console.log('Failed to log registration:', logError.message);
    }

    console.log(`✅ New ${role} registered:`, name);

    res.status(201).json({ 
      success: true, 
      message: 'User registered successfully',
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    
    // Safe error logging
    try {
      if (ActivityTracker && typeof ActivityTracker.log === 'function') {
        await ActivityTracker.log({
          userEmail: req.body.email || 'unknown',
          type: 'error_occurred',
          userName: req.body.name || 'Unknown',
          userRole: req.body.role || 'student',
          message: `System error during registration attempt - ${error.message}`,
          details: { 
            errorMessage: error.message,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent')
          },
          severity: 'high',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        });
      }
    } catch (logError) {
      console.error('❌ Failed to log registration error:', logError);
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ FIXED Logout route
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    console.log('🚪 Logout request received');
    
    const userId = req.user.userId || req.user.id;
    
    if (!userId) {
      console.error('❌ No user ID found in token');
      return res.status(400).json({ success: false, message: 'Invalid user session' });
    }
    
    // Get user details for logging
    let user;
    try {
      user = await User.findById(userId);
    } catch (dbError) {
      console.error('❌ Database error finding user:', dbError);
    }
    
    if (user) {
      console.log('✅ Logging activity for user:', user.email);

      try {
        if (ActivityTracker && typeof ActivityTracker.logUserLogout === 'function') {
          await ActivityTracker.logUserLogout(user, req);
        } else if (ActivityTracker && typeof ActivityTracker.log === 'function') {
          await ActivityTracker.log({
            userId: user._id,
            userEmail: user.email,
            userName: user.name,
            userRole: user.role,
            type: 'user_logout',
            message: `${user.name || user.email} logged out`,
            details: {},
            severity: 'low',
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent')
          });
        }
      } catch (logError) {
        console.log('Failed to log logout:', logError.message);
      }

      console.log(`✅ ${user.role || 'student'} logout successful:`, user.name || user.email);
    }
    
    res.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    
    // Safe error logging
    try {
      if (ActivityTracker && typeof ActivityTracker.log === 'function') {
        const userId = req.user?.userId || req.user?.id;
        await ActivityTracker.log({
          userId: userId,
          type: 'error_occurred',
          userName: 'System',
          userRole: 'system',
          message: `System error during logout attempt`,
          details: { 
            errorMessage: error.message,
            tokenUserId: userId,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent')
          },
          severity: 'medium',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        });
      }
    } catch (logError) {
      console.error('❌ Failed to log logout error:', logError);
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Logout failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ✅ Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Safe profile view logging
    try {
      if (ActivityTracker && typeof ActivityTracker.log === 'function') {
        await ActivityTracker.log({
          userId: userId,
          userEmail: user.email,
          userName: user.name || 'Unknown',
          userRole: user.role || 'student',
          type: 'profile_view',
          message: `User viewed their profile`,
          details: { 
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent')
          },
          severity: 'low',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        });
      }
    } catch (logError) {
      console.log('Failed to log profile view:', logError.message);
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Profile fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching profile' });
  }
});

// ✅ Verify token endpoint
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ 
    success: true, 
    message: 'Token is valid',
    user: {
      userId: req.user.userId,
      role: req.user.role
    }
  });
});

module.exports = router;
