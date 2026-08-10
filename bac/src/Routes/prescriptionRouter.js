const express = require('express');
const prescriptionController = require('../Controllers/prescriptionController');
const authController = require('../Controllers/authController');

const router = express.Router();

// Require authentication for all prescription routes
router.use(authController.protect);

router.get('/last', prescriptionController.getLastPrescriptions);
router.get('/', prescriptionController.getAllPrescriptions);
router.get('/:id', prescriptionController.getPrescription);
router.post('/', prescriptionController.createPrescription);
router.patch('/:id', prescriptionController.updatePrescription);
router.patch('/:id/status', prescriptionController.updatePrescriptionStatus);
router.delete('/:id', prescriptionController.deletePrescription);

module.exports = router;
