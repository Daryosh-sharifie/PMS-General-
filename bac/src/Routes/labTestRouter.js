const express = require("express");
const { protect, restrictTo } = require("../Controllers/authController");
const {
  createLabTest,
  deleteLabTest,
  getLabTest,
  getLabTests,
  updateLabTest,
} = require("../Controllers/labTestController");

const router = express.Router();

router.use(protect);

router.get("/get-tests", getLabTests);

router
  .route("/tests")
  .get(getLabTests)
  .post(restrictTo("Admin", "Doctor", "LabStaff"), createLabTest);

router
  .route("/tests/:id")
  .get(getLabTest)
  .patch(restrictTo("Admin", "Doctor", "LabStaff"), updateLabTest)
  .put(restrictTo("Admin", "Doctor", "LabStaff"), updateLabTest)
  .delete(restrictTo("Admin", "Doctor", "LabStaff"), deleteLabTest);

module.exports = router;
