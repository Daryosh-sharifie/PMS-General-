const express = require('express');
const backupController = require('../Controllers/backupController');
const authController = require('../Controllers/authController');

const router = express.Router();

// All backup routes require authentication
router.use(authController.protect);

// Download (export)
router.get('/full', backupController.getFullBackup);
router.get('/patients', backupController.getPatientsBackup);
router.get('/prescriptions', backupController.getPrescriptionsBackup);
router.get('/medicines', backupController.getMedicinesBackup);

// Upload (restore) — body size limit is handled by express.json() in app.js
router.post('/restore/full', backupController.restoreFull);
router.post('/restore/patients', backupController.restorePatients);
router.post('/restore/prescriptions', backupController.restorePrescriptions);
router.post('/restore/medicines', backupController.restoreMedicines);

module.exports = router;
