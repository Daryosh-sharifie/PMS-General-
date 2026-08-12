const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const prisma = require("../DBconfig/Prisma");

const ALLOWED_FIELD_TYPES = ["text", "number", "select", "boolean", "date", "textarea"];

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const normalizeResultFields = (resultFields, { required = false } = {}) => {
  if (resultFields === undefined) {
    if (required) return [];
    return undefined;
  }

  if (resultFields === null || resultFields === "") {
    return [];
  }

  if (!Array.isArray(resultFields)) {
    throw new AppError("resultFields must be an array", 400);
  }

  const seenKeys = new Set();

  return resultFields.map((field, index) => {
    if (!isPlainObject(field)) {
      throw new AppError(`resultFields[${index}] must be an object`, 400);
    }

    const key = field.key?.toString().trim();
    const label = field.label?.toString().trim();
    const type = field.type?.toString().trim();

    if (!key) {
      throw new AppError(`resultFields[${index}].key is required`, 400);
    }

    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)) {
      throw new AppError(
        `resultFields[${index}].key must start with a letter and contain only letters, numbers, and underscores`,
        400
      );
    }

    if (seenKeys.has(key)) {
      throw new AppError(`Duplicate result field key: ${key}`, 400);
    }
    seenKeys.add(key);

    if (!label) {
      throw new AppError(`resultFields[${index}].label is required`, 400);
    }

    if (!ALLOWED_FIELD_TYPES.includes(type)) {
      throw new AppError(
        `resultFields[${index}].type must be one of: ${ALLOWED_FIELD_TYPES.join(", ")}`,
        400
      );
    }

    const normalizedField = {
      key,
      label,
      type,
      required: Boolean(field.required),
    };

    if (field.unit !== undefined && field.unit !== null) {
      normalizedField.unit = field.unit.toString().trim();
    }

    if (field.referenceRange !== undefined && field.referenceRange !== null) {
      normalizedField.referenceRange = field.referenceRange.toString().trim();
    }

    if (field.placeholder !== undefined && field.placeholder !== null) {
      normalizedField.placeholder = field.placeholder.toString().trim();
    }

    if (field.options !== undefined) {
      if (!Array.isArray(field.options)) {
        throw new AppError(`resultFields[${index}].options must be an array`, 400);
      }

      normalizedField.options = field.options
        .map((option) => option?.toString().trim())
        .filter(Boolean);

      if (type === "select" && normalizedField.options.length === 0) {
        throw new AppError(`resultFields[${index}].options is required for select fields`, 400);
      }
    }

    return normalizedField;
  });
};

const getLabTestId = (id) => {
  const labTestId = Number(id);
  if (!Number.isInteger(labTestId) || labTestId <= 0) {
    throw new AppError("Invalid lab test ID", 400);
  }
  return labTestId;
};

const buildLabTestData = (body, { partial = false } = {}) => {
  const data = {};

  if (!partial || body.name !== undefined) {
    const name = body.name?.toString().trim();
    if (!name) throw new AppError("Lab test name is required", 400);
    data.name = name;
  }

  if (!partial || body.category !== undefined) {
    data.category = body.category ? body.category.toString().trim() : null;
  }

  if (!partial || body.description !== undefined) {
    data.description = body.description ? body.description.toString().trim() : null;
  }

  const resultFields = normalizeResultFields(body.resultFields, { required: !partial });
  if (resultFields !== undefined) {
    data.resultFields = resultFields;
  }

  if (body.isActive !== undefined) {
    data.isActive = Boolean(body.isActive);
  }

  return data;
};

const sendUniqueNameError = (error, next) => {
  if (error.code === "P2002") {
    return next(new AppError("A lab test with this name already exists", 400));
  }
  return next(error);
};

exports.getLabTests = catchAsync(async (req, res) => {
  const search = req.query.search?.trim();
  const category = req.query.category?.trim();
  const includeInactive = req.query.includeInactive === "true";

  const where = {};

  if (!includeInactive) {
    where.isActive = true;
  }

  if (category) {
    where.category = category;
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { category: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const labTests = await prisma.labTest.findMany({
    where,
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  res.status(200).json({
    success: true,
    count: labTests.length,
    data: labTests,
  });
});

exports.getLabTest = catchAsync(async (req, res, next) => {
  const labTest = await prisma.labTest.findUnique({
    where: { id: getLabTestId(req.params.id) },
  });

  if (!labTest) {
    return next(new AppError("Lab test not found", 404));
  }

  res.status(200).json({
    success: true,
    data: labTest,
  });
});

exports.createLabTest = catchAsync(async (req, res, next) => {
  try {
    const labTest = await prisma.labTest.create({
      data: {
        ...buildLabTestData(req.body),
        isActive: req.body.isActive === undefined ? true : Boolean(req.body.isActive),
      },
    });

    res.status(201).json({
      success: true,
      message: "Lab test created successfully",
      data: labTest,
    });
  } catch (error) {
    return sendUniqueNameError(error, next);
  }
});

exports.updateLabTest = catchAsync(async (req, res, next) => {
  const labTestId = getLabTestId(req.params.id);

  const existingLabTest = await prisma.labTest.findUnique({
    where: { id: labTestId },
  });

  if (!existingLabTest) {
    return next(new AppError("Lab test not found", 404));
  }

  try {
    const labTest = await prisma.labTest.update({
      where: { id: labTestId },
      data: buildLabTestData(req.body, { partial: true }),
    });

    res.status(200).json({
      success: true,
      message: "Lab test updated successfully",
      data: labTest,
    });
  } catch (error) {
    return sendUniqueNameError(error, next);
  }
});

exports.deleteLabTest = catchAsync(async (req, res, next) => {
  const labTestId = getLabTestId(req.params.id);

  const existingLabTest = await prisma.labTest.findUnique({
    where: { id: labTestId },
    include: {
      _count: {
        select: { orderItems: true },
      },
    },
  });

  if (!existingLabTest) {
    return next(new AppError("Lab test not found", 404));
  }

  if (existingLabTest._count.orderItems > 0) {
    const labTest = await prisma.labTest.update({
      where: { id: labTestId },
      data: { isActive: false },
    });

    return res.status(200).json({
      success: true,
      message: "Lab test is used in lab orders, so it was deactivated instead of permanently deleted",
      data: labTest,
    });
  }

  await prisma.labTest.delete({
    where: { id: labTestId },
  });

  res.status(200).json({
    success: true,
    message: "Lab test deleted successfully",
  });
});
