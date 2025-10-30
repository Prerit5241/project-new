const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/auth'); // auth + authorize

// ======= PUBLIC REGISTER (Always 'student') =======
router.post('/register', userController.publicRegister);

// ======= LOGIN =======
router.post('/login', userController.loginUser);

// ======= ADMIN CREATE USER =======
router.post('/prerit', auth, auth.authorize(['admin']), userController.adminCreateUser);

// ======= ADMIN GET ALL USERS =======
router.get('/prerit', auth, auth.authorize(['admin']), userController.getAllUsers);

// ======= PROFILE ROUTES =======
router.get('/profile', auth, userController.profile);
router.put('/profile', auth, userController.updateProfile);

// ======= UPDATE USER BY ID (ADMIN or SELF) =======
router.put(
  '/:id',
  auth,
  (req, res, next) => {
    if (req.user.role === 'admin' || req.user.userId === Number(req.params.id)) return next();
    return res.status(403).json({ success: false, msg: 'Access denied' });
  },
  userController.updateUserById
);

// ======= DELETE USER BY ID (ADMIN or SELF) =======
router.delete(
  '/:id',
  auth,
  (req, res, next) => {
    if (req.user.role === 'admin' || req.user.userId === Number(req.params.id)) return next();
    return res.status(403).json({ success: false, msg: 'Access denied' });
  },
  userController.deleteUserById
);

// ======= GET USER BY ID (ADMIN or SELF) =======
router.get(
  '/:id',
  auth,
  (req, res, next) => {
    if (req.user.role === 'admin' || req.user.userId === Number(req.params.id)) return next();
    return res.status(403).json({ success: false, msg: 'Access denied' });
  },
  userController.getUserById
);

// ======= UPDATE USER COINS (ADMIN ONLY) =======
router.put(
  '/:id/coins',
  auth,
  auth.authorize(['admin']),
  userController.updateUserCoins
);

module.exports = router;
