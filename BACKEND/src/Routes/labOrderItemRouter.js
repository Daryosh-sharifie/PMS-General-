const express = require("express");
const { protect } = require("../controllers/authController");
const {
  startLabOrderItem,
  updateLabOrderItemResult,
  verifyLabOrderItem,
  cancelLabOrderItem,
} = require("../controllers/labOrderItemController");

const router = express.Router();

router.put("/:id/start", protect, startLabOrderItem);
router.put("/:id/result", protect, updateLabOrderItemResult);
router.put("/:id/verify", protect, verifyLabOrderItem);
router.put("/:id/cancel", protect, cancelLabOrderItem);

module.exports = router;