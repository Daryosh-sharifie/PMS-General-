const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const prisma = require('../DBconfig/Prisma');
const logActivity = require('../utils/logActivity');

const parseId = (id, label) => {
  const parsed = parseInt(id, 10);
  if (isNaN(parsed) || parsed <= 0) {
    throw new AppError(`Invalid ${label} ID`, 400);
  }
  return parsed;
};

/**
 * Builds CRUD handlers for simple name-only lookup tables
 * (medicine frequencies, meal timings, ...).
 */
const createLookupController = ({ modelKey, label, entity, defaults = [] }) => {
  const model = () => prisma[modelKey];

  const seedDefaults = async () => {
    if (!defaults.length) return;
    const count = await model().count();
    if (count > 0) return;

    await model().createMany({
      data: defaults.map((name) => ({ name })),
      skipDuplicates: true,
    });
  };

  const getAll = catchAsync(async (req, res) => {
    await seedDefaults();

    const items = await model().findMany({
      orderBy: { id: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: items,
    });
  });

  const create = catchAsync(async (req, res, next) => {
    const name = req.body.name?.trim();

    if (!name) {
      return next(new AppError(`${label} name is required`, 400));
    }

    if (name.length > 100) {
      return next(new AppError(`${label} name must not exceed 100 characters`, 400));
    }

    const existing = await model().findUnique({ where: { name } });
    if (existing) {
      return next(new AppError(`${label} already exists`, 409));
    }

    const item = await model().create({ data: { name } });

    await logActivity({
      action: `CREATE_${entity.toUpperCase()}`,
      entity,
      entityId: item.id,
      description: `${label} added: ${item.name}`,
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
    });

    res.status(201).json({
      success: true,
      data: item,
    });
  });

  const update = catchAsync(async (req, res, next) => {
    const id = parseId(req.params.id, label);
    const name = req.body.name?.trim();

    if (!name) {
      return next(new AppError(`${label} name is required`, 400));
    }

    const existing = await model().findUnique({ where: { id } });
    if (!existing) {
      return next(new AppError(`${label} not found`, 404));
    }

    const duplicate = await model().findFirst({
      where: { name, NOT: { id } },
    });
    if (duplicate) {
      return next(new AppError(`${label} already exists`, 409));
    }

    const item = await model().update({
      where: { id },
      data: { name },
    });

    await logActivity({
      action: `UPDATE_${entity.toUpperCase()}`,
      entity,
      entityId: item.id,
      description: `${label} updated: ${existing.name} → ${item.name}`,
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
    });

    res.status(200).json({
      success: true,
      data: item,
    });
  });

  const remove = catchAsync(async (req, res, next) => {
    const id = parseId(req.params.id, label);

    const existing = await model().findUnique({ where: { id } });
    if (!existing) {
      return next(new AppError(`${label} not found`, 404));
    }

    await model().delete({ where: { id } });

    await logActivity({
      action: `DELETE_${entity.toUpperCase()}`,
      entity,
      entityId: id,
      description: `${label} deleted: ${existing.name}`,
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
    });

    res.status(200).json({
      success: true,
      message: `${label} deleted successfully`,
    });
  });

  return { getAll, create, update, remove };
};

module.exports = createLookupController;
