const catchAsync = require('../utils/catchAsync');
const prisma = require('../dbConfig/prisma');

exports.getActivityLogs = catchAsync(async (req, res, next) => {
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
