const express = require('express');
const patientController = require('../Controllers/patientController');
const authController =require('../Controllers/authController')

const router = express.Router();

router.get('/',
     authController.protect,
     patientController.getAllPatients);
router.get('/:id/prescriptions',
     authController.protect,
     patientController.getPatientWithPrescriptions);
router.get('/:id',
     authController.protect,
     patientController.getPatient);
router.post('/', authController.protect, patientController.createPatient);
router.patch('/:id', authController.protect, patientController.updatePatient);
router.delete('/:id', authController.protect, patientController.deletePatient);

module.exports = router;
