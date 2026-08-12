const express = require('express');
const appController = require('../Controllers/appSettingController');
const { uploadLogo } = require('../middleware/multer');
const authController = require('../Controllers/authController');

const router = express.Router();

router.get('/', appController.getAppSetting);
// Use multer for both JSON + multipart on create/update; field name: logo
router.post('/', authController.protect, uploadLogo.single('logo'), appController.createAppSetting);
router.patch('/', authController.protect, uploadLogo.single('logo'), appController.updateAppSetting);
router.delete('/', authController.protect, appController.deleteAppSetting);


module.exports = router;