const express = require('express');
const medicineCategoryController = require('../Controllers/medicineCategoryController');
const authController = require('../Controllers/authController');

const router = express.Router();

router.use(authController.softAuth);

router
  .route('/')
  .get(medicineCategoryController.getAllCategories)
  .post(medicineCategoryController.createCategory);

router
  .route('/:id')
  .get(medicineCategoryController.getCategory)
  .put(medicineCategoryController.updateCategory)
  .delete(medicineCategoryController.deleteCategory);

module.exports = router;
