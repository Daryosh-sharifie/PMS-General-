const express = require('express');
const userController = require('../Controllers/userController');
const authController = require('../Controllers/authController');
const { uploadAvatar } = require('../middleware/multer');

const router = express.Router();

// Protect all routes - require authentication
router.use(authController.protect);

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUser);
router.post('/',
    //  authController.restrictTo('admin'),
 uploadAvatar.single('avatar'), userController.createUser);
router.patch('/:id',
    //  authController.restrictTo('admin'),
 uploadAvatar.single('avatar'), userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
