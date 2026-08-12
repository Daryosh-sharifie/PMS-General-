const express = require('express');
const router = express.Router();
const medicineController = require('../Controllers/medicineController');
const authController = require('../Controllers/authController');

// Populate req.user from the JWT cookie when present (never blocks the request)
router.use(authController.softAuth);

// Search route (must be before /:id to avoid conflict)
router.get('/search', medicineController.searchMedicines);

// CRUD routes
router
  .route('/')
  .get(medicineController.getAllMedicines)
  .post(medicineController.createMedicine);

router
  .route('/:id')
  .get(medicineController.getMedicine)
  .put(medicineController.updateMedicine)
  .delete(medicineController.deleteMedicine);

module.exports = router;
