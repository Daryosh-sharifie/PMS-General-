const express = require('express');
const authController = require('../Controllers/authController');
const { uploadAvatar } = require('../middleware/multer');

const router = express.Router();

router.post('/signup', uploadAvatar.single('avatar'), authController.signup);
router.post('/login', authController.logIn);
router.post('/logout', authController.protect, authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:resetToken', authController.resetPassword);
router.get('/me', authController.protect, authController.getMe);

module.exports = router;
