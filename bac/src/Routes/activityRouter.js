const express = require('express');
const activityController = require('../Controllers/activityController');
const authController = require('../Controllers/authController');

const router = express.Router();

// Only authenticated admins can view activity logs
router.use(authController.protect);
router.use(authController.restrictTo('Admin'));

router.get('/', activityController.getActivityLogs);
router.delete('/', activityController.deleteAllLogs);

module.exports = router;
