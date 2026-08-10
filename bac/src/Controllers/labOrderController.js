const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const createLabOrder = async (req, res) => {
  try {
    const { patientId, prescriptionId, testIds, notes } = req.body;

    if (!patientId || !Array.isArray(testIds) || testIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "patientId and testIds are required",
      });
    }

    const tests = await prisma.labTest.findMany({
      where: {
        id: { in: testIds.map(Number) },
        isActive: true,
      },
    });

    if (tests.length !== testIds.length) {
      return res.status(400).json({
        success: false,
        message: "Some selected lab tests are invalid or inactive",
      });
    }

    const labOrderNo = `LAB-${Date.now()}`;

    const labOrder = await prisma.labOrder.create({
      data: {
        labOrderNo,
        patientId: Number(patientId),
        prescriptionId: prescriptionId ? Number(prescriptionId) : null,
        requestedById: req.user?.id || null,
        notes: notes || null,
        status: "REQUESTED",

        items: {
          create: tests.map((test) => ({
            labTestId: test.id,
            testNameSnapshot: test.name,
            categorySnapshot: test.category,
            templateSnapshot: test.resultFields,
            status: "REQUESTED",
          })),
        },
      },
      include: {
        patient: true,
        prescription: true,
        requestedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        items: {
          include: {
            labTest: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Lab request created successfully",
      data: labOrder,
    });
  } catch (error) {
    console.error("Create lab order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create lab request",
    });
  }
};

const getLabOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const labOrder = await prisma.labOrder.findUnique({
            where: {
                id: Number(id),
            },
            include: {
                patient: true,
                prescription: true,
                requestedBy: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    },
                },
                items: {
                    include: {
                        labTest: true,
                        enteredBy: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                        verifiedBy: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                    orderBy: {
                        id: "asc",
                    },
                },
            },
        });

        if (!labOrder) {
            return res.status(404).json({
                success: false,
                message: "Lab order not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: labOrder,
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch lab order",
        });
    }
};

const getAllLabOrders = async (req, res) => {
  try {
    const labOrders = await prisma.labOrder.findMany({
      include: {
        patient: true,
        prescription: true,
        requestedBy: { select: { id: true, name: true, role: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ success: true, data: labOrders });
  } catch (error) {
    console.error("Get all lab orders error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch lab orders" });
  }
};

const getLabOrdersByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    const labOrders = await prisma.labOrder.findMany({
      where: { patientId: Number(patientId) },
      include: {
        patient: true,
        prescription: true,
        requestedBy: { select: { id: true, name: true, role: true } },
        items: { include: { labTest: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ success: true, data: labOrders });
  } catch (error) {
    console.error("Get patient lab orders error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch patient lab orders" });
  }
};

const getLabOrdersByPrescription = async (req, res) => {
  try {
    const { prescriptionId } = req.params;

    const labOrders = await prisma.labOrder.findMany({
      where: { prescriptionId: Number(prescriptionId) },
      include: {
        patient: true,
        prescription: true,
        requestedBy: { select: { id: true, name: true, role: true } },
        items: { include: { labTest: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ success: true, data: labOrders });
  } catch (error) {
    console.error("Get prescription lab orders error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch prescription lab orders" });
  }
};

module.exports = {
  createLabOrder,
  getLabOrderById,
  getAllLabOrders,
  getLabOrdersByPatient,
  getLabOrdersByPrescription,
};