const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const prisma = require('../DBconfig/Prisma');

exports.getFullBackup = catchAsync(async (req, res) => {
  const [patients, prescriptions, medicines] = await Promise.all([
    prisma.patient.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.prescription.findMany({
      include: { patient: true, medicines: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.medicine.findMany({ orderBy: { createdAt: 'desc' } }),
  ]);

  res.status(200).json({
    status: 'success',
    exportedAt: new Date().toISOString(),
    data: { patients, prescriptions, medicines },
  });
});

exports.getPatientsBackup = catchAsync(async (req, res) => {
  const patients = await prisma.patient.findMany({ orderBy: { createdAt: 'desc' } });

  res.status(200).json({
    status: 'success',
    exportedAt: new Date().toISOString(),
    data: { patients },
  });
});

exports.getPrescriptionsBackup = catchAsync(async (req, res) => {
  const prescriptions = await prisma.prescription.findMany({
    include: { patient: true, medicines: true },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    status: 'success',
    exportedAt: new Date().toISOString(),
    data: { prescriptions },
  });
});

exports.getMedicinesBackup = catchAsync(async (req, res) => {
  const medicines = await prisma.medicine.findMany({ orderBy: { createdAt: 'desc' } });

  res.status(200).json({
    status: 'success',
    exportedAt: new Date().toISOString(),
    data: { medicines },
  });
});

// ─── Restore Endpoints ───────────────────────────────────────────────────────

exports.restorePatients = catchAsync(async (req, res, next) => {
  const patients = req.body?.data?.patients ?? req.body?.patients;
  if (!Array.isArray(patients)) {
    return next(new AppError('فایل معتبر نیست: آرایه patients یافت نشد', 400));
  }

  let created = 0, updated = 0;
  for (const p of patients) {
    const { id, createdAt, prescription, ...fields } = p;
    await prisma.patient.upsert({
      where: { id: id || -1 },
      update: fields,
      create: { ...fields, ...(id ? { id } : {}) },
    });
    const existing = await prisma.patient.findUnique({ where: { id } });
    existing ? updated++ : created++;
  }

  res.status(200).json({ status: 'success', message: `${patients.length} مریض بازیابی شد`, total: patients.length });
});

exports.restoreMedicines = catchAsync(async (req, res, next) => {
  const medicines = req.body?.data?.medicines ?? req.body?.medicines;
  if (!Array.isArray(medicines)) {
    return next(new AppError('فایل معتبر نیست: آرایه medicines یافت نشد', 400));
  }

  for (const m of medicines) {
    const { id, createdAt, updatedAt, ...fields } = m;
    await prisma.medicine.upsert({
      where: { id: id || -1 },
      update: fields,
      create: { ...fields, ...(id ? { id } : {}) },
    });
  }

  res.status(200).json({ status: 'success', message: `${medicines.length} دوا بازیابی شد`, total: medicines.length });
});

exports.restorePrescriptions = catchAsync(async (req, res, next) => {
  const prescriptions = req.body?.data?.prescriptions ?? req.body?.prescriptions;
  if (!Array.isArray(prescriptions)) {
    return next(new AppError('فایل معتبر نیست: آرایه prescriptions یافت نشد', 400));
  }

  let restored = 0;
  for (const rx of prescriptions) {
    const { id, createdAt, updatedAt, patient, medicines, doctor, ...fields } = rx;

    // Ensure referenced patient exists
    const patientExists = await prisma.patient.findUnique({ where: { id: fields.patientId } });
    if (!patientExists) continue; // skip orphaned prescriptions

    await prisma.prescription.upsert({
      where: { prescriptionNo: fields.prescriptionNo },
      update: {
        ...fields,
        ...(medicines && {
          medicines: {
            deleteMany: {},
            create: medicines.map(({ id: _id, prescriptionId: _pid, ...med }) => med),
          },
        }),
      },
      create: {
        ...fields,
        ...(id ? { id } : {}),
        ...(medicines && {
          medicines: {
            create: medicines.map(({ id: _id, prescriptionId: _pid, ...med }) => med),
          },
        }),
      },
    });
    restored++;
  }

  res.status(200).json({ status: 'success', message: `${restored} نسخه بازیابی شد`, total: restored });
});

exports.restoreFull = catchAsync(async (req, res, next) => {
  const body = req.body;
  const patients = body?.data?.patients ?? body?.patients;
  const medicines = body?.data?.medicines ?? body?.medicines;
  const prescriptions = body?.data?.prescriptions ?? body?.prescriptions;

  if (!Array.isArray(patients) && !Array.isArray(medicines) && !Array.isArray(prescriptions)) {
    return next(new AppError('فایل معتبر نیست: هیچ داده‌ای یافت نشد', 400));
  }

  const results = {};

  if (Array.isArray(patients)) {
    for (const p of patients) {
      const { id, createdAt, prescription, ...fields } = p;
      await prisma.patient.upsert({
        where: { id: id || -1 },
        update: fields,
        create: { ...fields, ...(id ? { id } : {}) },
      });
    }
    results.patients = patients.length;
  }

  if (Array.isArray(medicines)) {
    for (const m of medicines) {
      const { id, createdAt, updatedAt, ...fields } = m;
      await prisma.medicine.upsert({
        where: { id: id || -1 },
        update: fields,
        create: { ...fields, ...(id ? { id } : {}) },
      });
    }
    results.medicines = medicines.length;
  }

  if (Array.isArray(prescriptions)) {
    let restored = 0;
    for (const rx of prescriptions) {
      const { id, createdAt, updatedAt, patient, medicines: rxMeds, doctor, ...fields } = rx;
      const patientExists = await prisma.patient.findUnique({ where: { id: fields.patientId } });
      if (!patientExists) continue;
      await prisma.prescription.upsert({
        where: { prescriptionNo: fields.prescriptionNo },
        update: {
          ...fields,
          ...(rxMeds && {
            medicines: {
              deleteMany: {},
              create: rxMeds.map(({ id: _id, prescriptionId: _pid, ...med }) => med),
            },
          }),
        },
        create: {
          ...fields,
          ...(id ? { id } : {}),
          ...(rxMeds && {
            medicines: {
              create: rxMeds.map(({ id: _id, prescriptionId: _pid, ...med }) => med),
            },
          }),
        },
      });
      restored++;
    }
    results.prescriptions = restored;
  }

  res.status(200).json({ status: 'success', message: 'بازیابی کامل انجام شد', results });
});
