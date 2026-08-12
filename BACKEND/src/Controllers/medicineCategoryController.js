const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const prisma = require('../DBconfig/Prisma');
const logActivity = require('../utils/logActivity');

const DEFAULT_CATEGORIES = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Injection',
  'Drops',
  'Ointment',
  'Paste',
  'Vial',
  'Suppository',
  'Inhaler',
  'Infusion',
  'Solution',
  'Serum',
  'Powder',
  'Granules',
  'Lozenge',
  'Spray',
  'Patch',
  'Other',
];

const getCategoryId = (id) => {
  const categoryId = parseInt(id, 10);
  if (isNaN(categoryId) || categoryId <= 0) {
    throw new AppError('Invalid category ID', 400);
  }
  return categoryId;
};

const seedDefaultCategories = async () => {
  const count = await prisma.medicineCategory.count();
  if (count > 0) return;

  await prisma.medicineCategory.createMany({
    data: DEFAULT_CATEGORIES.map((name) => ({ name })),
    skipDuplicates: true,
  });
};

exports.getAllCategories = catchAsync(async (req, res) => {
  await seedDefaultCategories();

  const categories = await prisma.medicineCategory.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { medicines: true },
      },
    },
  });

  res.status(200).json({
    success: true,
    data: categories,
  });
});

exports.getCategory = catchAsync(async (req, res, next) => {
  const categoryId = getCategoryId(req.params.id);

  const category = await prisma.medicineCategory.findUnique({
    where: { id: categoryId },
    include: {
      _count: {
        select: { medicines: true },
      },
    },
  });

  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  res.status(200).json({
    success: true,
    data: category,
  });
});

exports.createCategory = catchAsync(async (req, res, next) => {
  const name = req.body.name?.trim();

  if (!name) {
    return next(new AppError('Category name is required', 400));
  }

  if (name.length > 100) {
    return next(new AppError('Category name must not exceed 100 characters', 400));
  }

  const existing = await prisma.medicineCategory.findUnique({
    where: { name },
  });

  if (existing) {
    return next(new AppError('Category already exists', 409));
  }

  const category = await prisma.medicineCategory.create({
    data: { name },
  });

  await logActivity({
    action: 'CREATE_MEDICINE_CATEGORY',
    entity: 'MedicineCategory',
    entityId: category.id,
    description: `کتگوری دوا اضافه شد: ${category.name}`,
    userId: req.user?.id,
    userName: req.user?.name,
    userRole: req.user?.role,
  });

  res.status(201).json({
    success: true,
    data: category,
  });
});

exports.updateCategory = catchAsync(async (req, res, next) => {
  const categoryId = getCategoryId(req.params.id);
  const name = req.body.name?.trim();

  if (!name) {
    return next(new AppError('Category name is required', 400));
  }

  if (name.length > 100) {
    return next(new AppError('Category name must not exceed 100 characters', 400));
  }

  const existingCategory = await prisma.medicineCategory.findUnique({
    where: { id: categoryId },
  });

  if (!existingCategory) {
    return next(new AppError('Category not found', 404));
  }

  const duplicate = await prisma.medicineCategory.findFirst({
    where: {
      name,
      NOT: { id: categoryId },
    },
  });

  if (duplicate) {
    return next(new AppError('Category already exists', 409));
  }

  const category = await prisma.$transaction(async (tx) => {
    const updated = await tx.medicineCategory.update({
      where: { id: categoryId },
      data: { name },
    });

    await tx.medicine.updateMany({
      where: { categoryId },
      data: { type: name },
    });

    return updated;
  });

  await logActivity({
    action: 'UPDATE_MEDICINE_CATEGORY',
    entity: 'MedicineCategory',
    entityId: category.id,
    description: `کتگوری دوا ویرایش شد: ${existingCategory.name} → ${category.name}`,
    userId: req.user?.id,
    userName: req.user?.name,
    userRole: req.user?.role,
  });

  res.status(200).json({
    success: true,
    data: category,
  });
});

exports.deleteCategory = catchAsync(async (req, res, next) => {
  const categoryId = getCategoryId(req.params.id);

  const category = await prisma.medicineCategory.findUnique({
    where: { id: categoryId },
    include: {
      _count: {
        select: { medicines: true },
      },
    },
  });

  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  if (category._count.medicines > 0) {
    return next(
      new AppError(
        `Cannot delete category used by ${category._count.medicines} medicine(s)`,
        400
      )
    );
  }

  await prisma.medicineCategory.delete({
    where: { id: categoryId },
  });

  await logActivity({
    action: 'DELETE_MEDICINE_CATEGORY',
    entity: 'MedicineCategory',
    entityId: categoryId,
    description: `کتگوری دوا حذف شد: ${category.name}`,
    userId: req.user?.id,
    userName: req.user?.name,
    userRole: req.user?.role,
  });

  res.status(200).json({
    success: true,
    message: 'Category deleted successfully',
  });
});
