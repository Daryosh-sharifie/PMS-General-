const express = require("express");
const {
  createLabOrder,
  getLabOrderById,
  getAllLabOrders,
  getLabOrdersByPatient,
  getLabOrdersByPrescription,
} = require("../controllers/labOrderController");
const { protect } = require("../controllers/authController");

const router = express.Router();

router.post("/create", protect, createLabOrder);
router.get("/get-all-orders", protect, getAllLabOrders);
router.get("/get-order/:id", protect, getLabOrderById);
router.get("/patient/:patientId", protect, getLabOrdersByPatient);
router.get("/prescription/:prescriptionId", protect, getLabOrdersByPrescription);

module.exports = router;