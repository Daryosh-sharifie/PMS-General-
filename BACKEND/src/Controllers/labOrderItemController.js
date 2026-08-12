const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const recalculateLabOrderStatus = async (labOrderId) => {
  const items = await prisma.labOrderItem.findMany({
    where: { labOrderId },
    select: { status: true },
  });

  let status = "REQUESTED";

  const allCancelled = items.every((item) => item.status === "CANCELLED");
  const allVerified = items.every((item) => item.status === "VERIFIED");
  const allCompletedOrVerified = items.every(
    (item) => item.status === "COMPLETED" || item.status === "VERIFIED"
  );
  const someCompletedOrVerified = items.some(
    (item) => item.status === "COMPLETED" || item.status === "VERIFIED"
  );
  const someInProgress = items.some((item) => item.status === "IN_PROGRESS");

  if (allCancelled) status = "CANCELLED";
  else if (allVerified) status = "VERIFIED";
  else if (allCompletedOrVerified) status = "COMPLETED";
  else if (someCompletedOrVerified) status = "PARTIAL_COMPLETED";
  else if (someInProgress) status = "IN_PROGRESS";

  await prisma.labOrder.update({
    where: { id: labOrderId },
    data: { status },
  });

  return status;
};

const startLabOrderItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await prisma.labOrderItem.findUnique({
      where: { id: Number(id) },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Lab order item not found",
      });
    }

    if (item.status !== "REQUESTED") {
      return res.status(400).json({
        success: false,
        message: `Only REQUESTED items can be started. Current status: ${item.status}`,
      });
    }

    const updatedItem = await prisma.labOrderItem.update({
      where: { id: Number(id) },
      data: {
        status: "IN_PROGRESS",
      },
    });

    const labOrderStatus = await recalculateLabOrderStatus(item.labOrderId);

    return res.status(200).json({
      success: true,
      message: "Lab test marked as in progress",
      labOrderStatus,
      data: updatedItem,
    });
  } catch (error) {
    console.error("Start lab item error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to start lab test",
    });
  }
};

const updateLabOrderItemResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { manualResults, remarks } = req.body;

    const item = await prisma.labOrderItem.findUnique({
      where: { id: Number(id) },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Lab order item not found",
      });
    }

    if (item.status === "VERIFIED" || item.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: `Cannot update result when status is ${item.status}`,
      });
    }

    const updatedItem = await prisma.labOrderItem.update({
      where: { id: Number(id) },
      data: {
        manualResults: manualResults || null,
        remarks: remarks || null,
        status: "COMPLETED",
        enteredById: req.user?.id || null,
        completedAt: new Date(),
      },
    });

    const labOrderStatus = await recalculateLabOrderStatus(item.labOrderId);

    return res.status(200).json({
      success: true,
      message: "Lab result saved successfully",
      labOrderStatus,
      data: updatedItem,
    });
  } catch (error) {
    console.error("Update lab result error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save lab result",
    });
  }
};

const verifyLabOrderItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await prisma.labOrderItem.findUnique({
      where: { id: Number(id) },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Lab order item not found",
      });
    }

    if (item.status !== "COMPLETED") {
      return res.status(400).json({
        success: false,
        message: `Only COMPLETED items can be verified. Current status: ${item.status}`,
      });
    }

    const updatedItem = await prisma.labOrderItem.update({
      where: { id: Number(id) },
      data: {
        status: "VERIFIED",
        verifiedById: req.user?.id || null,
        verifiedAt: new Date(),
      },
    });

    const labOrderStatus = await recalculateLabOrderStatus(item.labOrderId);

    return res.status(200).json({
      success: true,
      message: "Lab result verified successfully",
      labOrderStatus,
      data: updatedItem,
    });
  } catch (error) {
    console.error("Verify lab item error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify lab result",
    });
  }
};

const cancelLabOrderItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await prisma.labOrderItem.findUnique({
      where: { id: Number(id) },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Lab order item not found",
      });
    }

    if (item.status === "VERIFIED" || item.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel item with status ${item.status}`,
      });
    }

    const updatedItem = await prisma.labOrderItem.update({
      where: { id: Number(id) },
      data: {
        status: "CANCELLED",
      },
    });

    const labOrderStatus = await recalculateLabOrderStatus(item.labOrderId);

    return res.status(200).json({
      success: true,
      message: "Lab test cancelled successfully",
      labOrderStatus,
      data: updatedItem,
    });
  } catch (error) {
    console.error("Cancel lab item error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel lab test",
    });
  }
};

module.exports = {
  startLabOrderItem,
  updateLabOrderItemResult,
  verifyLabOrderItem,
  cancelLabOrderItem
};