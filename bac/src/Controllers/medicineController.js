const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const prisma = require('../DBconfig/Prisma');
const logActivity = require('../utils/logActivity');

const resolveCategory = async (categoryId, type) => {
  if (categoryId) {
    const parsedId = parseInt(categoryId, 10);
    if (!isNaN(parsedId) && parsedId > 0) {
      const category = await prisma.medicineCategory.findUnique({
        where: { id: parsedId },
      });
      if (category) {
        return { categoryId: category.id, type: category.name };
      }
    }
  }

  if (type?.trim()) {
    const trimmedType = type.trim();
    const category = await prisma.medicineCategory.findUnique({
      where: { name: trimmedType },
    });
    return {
      categoryId: category?.id ?? null,
      type: trimmedType,
    };
  }

  return null;
};

// Validation constants
const VALID_TYPES = ['قرص', 'کپسول', 'سیروپ', 'انجکشن', 'قطره', 'مرهم', 'پماد'];
const VALID_FREQUENCIES = ['1x1', '1x2', '1x3', '1x4', '2x1', '2x2', '2x3', '3x1', '3x2', '3x3'];
const VALID_MEAL_TIMINGS = ['قبل از غذا', 'بعد از غذا', 'بدون توجه به غذا'];

// Validation helper
const validateMedicineData = (data) => {
  const errors = {};

  if (!data.type) {
    errors.type = 'Type is required';
  } else if (!VALID_TYPES.includes(data.type)) {
    errors.type = `Type must be one of: ${VALID_TYPES.join(', ')}`;
  }

  if (!data.companyName) {
    errors.companyName = 'Company name is required';
  } else if (data.companyName.length > 255) {
    errors.companyName = 'Company name must not exceed 255 characters';
  }

  if (!data.genericName) {
    errors.genericName = 'Generic name is required';
  } else if (data.genericName.length > 255) {
    errors.genericName = 'Generic name must not exceed 255 characters';
  }

  if (!data.dosage) {
    errors.dosage = 'Dosage is required';
  } else if (data.dosage.length > 100) {
    errors.dosage = 'Dosage must not exceed 100 characters';
  }

  if (!data.frequency) {
    errors.frequency = 'Frequency is required';
  } else if (!VALID_FREQUENCIES.includes(data.frequency)) {
    errors.frequency = `Frequency must be one of: ${VALID_FREQUENCIES.join(', ')}`;
  }

  if (!data.mealTiming) {
    errors.mealTiming = 'Meal timing is required';
  } else if (!VALID_MEAL_TIMINGS.includes(data.mealTiming)) {
    errors.mealTiming = `Meal timing must be one of: ${VALID_MEAL_TIMINGS.join(', ')}`;
  }

  if (data.amount !== undefined && (isNaN(data.amount) || data.amount < 0)) {
    errors.amount = 'Amount must be a positive number';
  }

  return errors;
};

// GET /api/v1/medicines - Get all medicines with pagination and search
exports.getAllMedicines = catchAsync(async (req, res, next) => {
  // Pagination parameters
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const skip = (page - 1) * limit;

  // Search and filter parameters
  const search = req.query.search?.trim() || '';
  const typeFilter = req.query.type?.trim() || '';

  // Build where clause
  let whereClause = {};

  if (search) {
    whereClause.OR = [
      { genericName: { contains: search } },
      { companyName: { contains: search } },
      { type: { contains: search } },
    ];
  }

  if (typeFilter) {
    whereClause.type = typeFilter;
  }

  if (req.query.startDate || req.query.endDate) {
    whereClause.createdAt = {};
    if (req.query.startDate) {
      whereClause.createdAt.gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      whereClause.createdAt.lte = new Date(req.query.endDate);
    }
  }

  try {
    // Get total count for pagination
    const total = await prisma.medicine.count({
      where: whereClause,
    });

    // Fetch medicines with pagination
    const medicines = await prisma.medicine.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        category: true,
      },
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        medicines,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    });
  } catch (error) {
    throw error;
  }
});

// POST /api/v1/medicines - Create a new medicine
exports.createMedicine = catchAsync(async (req, res, next) => {
  const { type, categoryId, companyName, genericName, dosage, frequency, mealTiming, amount } = req.body;

  const resolvedCategory = await resolveCategory(categoryId, type);
  if (!resolvedCategory?.type) {
    return next(new AppError('Medicine category is required', 400));
  }

  // Trim string fields
  const medicineData = {
    type: resolvedCategory.type,
    categoryId: resolvedCategory.categoryId,
    companyName: companyName?.trim(),
    genericName: genericName?.trim(),
    dosage: dosage?.trim(),
    frequency: frequency?.trim(),
    mealTiming: mealTiming?.trim(),
    amount: amount ? parseInt(amount) : 0,
  };

  // Validation removed temporarily
  // const validationErrors = validateMedicineData(medicineData);
  // if (Object.keys(validationErrors).length > 0) {
  //   console.log('❌ Validation errors:', validationErrors);
  //   return next(new AppError('Validation failed', 400, validationErrors));
  // }

  try {
    // Create medicine
    const medicine = await prisma.medicine.create({
      data: {
        ...medicineData,
        createdBy: req.user?.id,
        updatedBy: req.user?.id,
      },
    });

    await logActivity({
      action: 'CREATE_MEDICINE',
      entity: 'Medicine',
      entityId: medicine.id,
      description: `دوا اضافه شد: ${medicine.genericName} (${medicine.type})`,
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
    });

    res.status(201).json({
      success: true,
      data: medicine,
    });
  } catch (error) {
    throw error;
  }
});

// GET /api/v1/medicines/:id - Get a single medicine by ID
exports.getMedicine = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const medicineId = parseInt(id);

  if (isNaN(medicineId)) {
    return next(new AppError('Invalid medicine ID', 400));
  }

  const medicine = await prisma.medicine.findUnique({
    where: { id: medicineId },
    include: { category: true },
  });

  if (!medicine) {
    return next(new AppError('Medicine not found', 404));
  }

  res.status(200).json({
    success: true,
    data: medicine,
  });
});

// PUT /api/v1/medicines/:id - Update a medicine
exports.updateMedicine = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const medicineId = parseInt(id);

  if (isNaN(medicineId)) {
    return next(new AppError('Invalid medicine ID', 400));
  }

  const { type, categoryId, companyName, genericName, dosage, frequency, mealTiming, amount } = req.body;

  const resolvedCategory = await resolveCategory(categoryId, type);
  if (!resolvedCategory?.type) {
    return next(new AppError('Medicine category is required', 400));
  }

  // Trim string fields
  const medicineData = {
    type: resolvedCategory.type,
    categoryId: resolvedCategory.categoryId,
    companyName: companyName?.trim(),
    genericName: genericName?.trim(),
    dosage: dosage?.trim(),
    frequency: frequency?.trim(),
    mealTiming: mealTiming?.trim(),
  };

  if (amount !== undefined) {
    medicineData.amount = parseInt(amount);
  }

  // Validation removed temporarily
  // const validationErrors = validateMedicineData(medicineData);
  // if (Object.keys(validationErrors).length > 0) {
  //   return next(new AppError('Validation failed', 400, validationErrors));
  // }

  // Check if medicine exists
  const existingMedicine = await prisma.medicine.findUnique({
    where: { id: medicineId },
  });

  if (!existingMedicine) {
    return next(new AppError('Medicine not found', 404));
  }

  // Update medicine
  const medicine = await prisma.medicine.update({
    where: { id: medicineId },
    data: {
      ...medicineData,
      updatedBy: req.user?.id,
    },
  });

  await logActivity({
    action: 'UPDATE_MEDICINE',
    entity: 'Medicine',
    entityId: medicine.id,
    description: `دوا ویرایش شد: ${medicine.genericName} (${medicine.type})`,
    userId: req.user?.id,
    userName: req.user?.name,
    userRole: req.user?.role,
  });

  res.status(200).json({
    success: true,
    data: medicine,
  });
});

// DELETE /api/v1/medicines/:id - Delete a medicine
exports.deleteMedicine = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const medicineId = parseInt(id);

  if (isNaN(medicineId)) {
    return next(new AppError('Invalid medicine ID', 400));
  }

  // Check if medicine exists
  const medicine = await prisma.medicine.findUnique({
    where: { id: medicineId },
  });

  if (!medicine) {
    return next(new AppError('Medicine not found', 404));
  }

  // Delete medicine
  await prisma.medicine.delete({
    where: { id: medicineId },
  });

  await logActivity({
    action: 'DELETE_MEDICINE',
    entity: 'Medicine',
    entityId: medicineId,
    description: `دوا حذف شد: ${medicine.genericName} (${medicine.type})`,
    userId: req.user?.id,
    userName: req.user?.name,
    userRole: req.user?.role,
  });

  res.status(200).json({
    success: true,
    message: 'Medicine deleted successfully',
  });
});

// GET /api/v1/medicines/search - Search medicines (alias for getAllMedicines with search)
exports.searchMedicines = catchAsync(async (req, res, next) => {
  const query = req.query.q?.trim() || '';

  if (!query) {
    return res.status(200).json({
      success: true,
      data: [],
    });
  }

  const medicines = await prisma.medicine.findMany({
    where: {
      OR: [
        { genericName: { contains: query } },
        { companyName: { contains: query } },
        { type: { contains: query } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 50, // Limit search results
  });

  res.status(200).json({
    success: true,
    data: medicines,
  });
});
