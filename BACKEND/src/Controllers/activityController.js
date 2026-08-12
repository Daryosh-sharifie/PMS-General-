const catchAsync = require('../utils/catchAsync');
const prisma = require('../dbConfig/prisma');

let backfilled = false;

const syncPastLabOrdersToActivityLogs = async () => {
  if (backfilled) return;
  try {
    const labOrders = await prisma.labOrder.findMany({
      include: {
        requestedBy: { select: { id: true, name: true, role: true } },
      },
    });

    for (const order of labOrders) {
      const existing = await prisma.activityLog.findFirst({
        where: {
          entity: 'LabOrder',
          entityId: order.id,
          action: 'CREATE_LAB_ORDER',
        },
      });

      if (!existing) {
        await prisma.activityLog.create({
          data: {
            action: 'CREATE_LAB_ORDER',
            entity: 'LabOrder',
            entityId: order.id,
            description: `درخواست جدید لابراتوار ثبت شد: ${order.labOrderNo || ''}`,
            userId: order.requestedById || order.requestedBy?.id || null,
            userName: order.requestedBy?.name || 'داکتر / سیستم',
            userRole: order.requestedBy?.role || 'doctor',
            createdAt: order.createdAt,
          },
        });
      }
    }
    backfilled = true;
  } catch (err) {
    console.error('Failed to sync past lab orders to activity logs:', err.message);
  }
};

exports.getActivityLogs = catchAsync(async (req, res, next) => {
  await syncPastLabOrdersToActivityLogs();

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.entity) filter.entity = req.query.entity;
  if (req.query.action) filter.action = req.query.action;

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.activityLog.count({ where: filter }),
  ]);

  res.status(200).json({
    status: 'success',
    results: logs.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    data: { logs },
  });
});

exports.deleteAllLogs = catchAsync(async (req, res, next) => {
  await prisma.activityLog.deleteMany({});
  res.status(200).json({ status: 'success', message: 'All activity logs deleted' });
});
