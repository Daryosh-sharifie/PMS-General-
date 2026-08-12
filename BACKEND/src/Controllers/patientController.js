const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const prisma = require("../dbConfig/prisma");
const logActivity = require("../utils/logActivity");

const toPositiveInt = (value, fallback = null) => {
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const cleanString = (value, fallback = "") => {
	if (value === undefined || value === null) return fallback;
	return String(value).trim();
};

const buildPatientWhereClause = (query = {}) => {
	const search = cleanString(query.search);
	const whereClause = {};

	if (search) {
		const isExactNumericSearch = /^\d+$/.test(search);
		const numericSearch = Number(search);

		whereClause.OR = [
			...(isExactNumericSearch ? [{ id: numericSearch }] : []),

			{ fullname: { contains: search } },
			{ fathername: { contains: search } },
			{ email: { contains: search } },
			{ address: { contains: search } },
			{ bloodGroup: { contains: search } },
			{ gender: { contains: search } },
			{ knownallergies: { contains: search } },

			// phone is String in Prisma schema, so it must always be searched as string.
			{ phone: { contains: search } },
		];
	}

	if (query.startDate || query.endDate) {
		whereClause.createdAt = {};

		if (query.startDate) {
			whereClause.createdAt.gte = new Date(query.startDate);
		}

		if (query.endDate) {
			whereClause.createdAt.lte = new Date(query.endDate);
		}
	}

	return whereClause;
};

const buildPatientPayload = (body = {}) => ({
	fullname: cleanString(body.fullname || body.name),
	fathername: cleanString(body.fathername),
	age: cleanString(body.age, "0"),
	bloodGroup: cleanString(body.bloodGroup),
	gender: cleanString(body.gender),
	email: cleanString(body.email) || null,
	phone: cleanString(body.phone),
	address: cleanString(body.address) || null,
	knownallergies: cleanString(body.knownallergies) || null,
});

const validatePatientPayload = (data, next) => {
	if (!data.fullname) {
		return next(new AppError("Patient full name is required", 400));
	}

	if (!data.fathername) {
		return next(new AppError("Father name is required", 400));
	}

	if (!data.age) {
		return next(new AppError("Age is required", 400));
	}

	if (!data.gender) {
		return next(new AppError("Gender is required", 400));
	}

	if (!data.phone) {
		return next(new AppError("Phone number is required", 400));
	}

	return null;
};

exports.getAllPatients = catchAsync(async (req, res, next) => {
	const page = toPositiveInt(req.query.page, 1);
	const limit = toPositiveInt(req.query.limit, 10);
	const skip = (page - 1) * limit;

	const whereClause = buildPatientWhereClause(req.query);

	const totalPatients = await prisma.patient.count({
		where: whereClause,
	});

	const patients = await prisma.patient.findMany({
		where: whereClause,
		orderBy: { createdAt: "desc" },
		skip,
		take: limit,
	});

	const totalPages = Math.ceil(totalPatients / limit) || 1;

	res.status(200).json({
		status: "success",
		results: patients.length,
		pagination: {
			currentPage: page,
			totalPages,
			totalRecords: totalPatients,
			limit,
			hasNextPage: page < totalPages,
			hasPreviousPage: page > 1,
		},
		data: { patients },
	});
});

exports.getPatient = catchAsync(async (req, res, next) => {
	const patientId = toPositiveInt(req.params.id);

	if (!patientId) {
		return next(new AppError("Invalid patient ID", 400));
	}

	const patient = await prisma.patient.findUnique({
		where: { id: patientId },
	});

	if (!patient) {
		return next(new AppError("Patient not found", 404));
	}

	res.status(200).json({
		status: "success",
		data: { patient },
	});
});

exports.getPatientWithPrescriptions = catchAsync(async (req, res, next) => {
	const patientId = toPositiveInt(req.params.id);

	if (!patientId) {
		return next(new AppError("Invalid patient ID", 400));
	}

	const patient = await prisma.patient.findUnique({
		where: { id: patientId },
		select: {
			id: true,
			fullname: true,
			fathername: true,
			age: true,
			bloodGroup: true,
			gender: true,
			email: true,
			phone: true,
			address: true,
			knownallergies: true,
			createdAt: true,
			prescription: {
				orderBy: { createdAt: "desc" },
				select: {
					id: true,
					prescriptionNo: true,
					date: true,
					diagnosis: true,
					status: true,
					createdAt: true,
					updatedAt: true,
				},
			},
			labOrders: {
				orderBy: { createdAt: "desc" },
				select: {
					id: true,
					labOrderNo: true,
					status: true,
					createdAt: true,
				},
			},
		},
	});

	if (!patient) {
		return next(new AppError("Patient not found", 404));
	}

	res.status(200).json({
		status: "success",
		data: { patient },
	});
});

exports.createPatient = catchAsync(async (req, res, next) => {
	const data = buildPatientPayload(req.body);

	const validationError = validatePatientPayload(data, next);
	if (validationError) return validationError;

	const patient = await prisma.patient.create({
		data,
	});

	logActivity({
		action: "CREATE_PATIENT",
		entity: "Patient",
		entityId: patient.id,
		description: `مریض جدید ثبت شد: ${patient.fullname || ""}`,
		userId: req.user?.id,
		userName: req.user?.name,
		userRole: req.user?.role,
	});

	res.status(201).json({
		status: "success",
		data: { patient },
	});
});

exports.updatePatient = catchAsync(async (req, res, next) => {
	const patientId = toPositiveInt(req.params.id);

	if (!patientId) {
		return next(new AppError("Invalid patient ID", 400));
	}

	const existingPatient = await prisma.patient.findUnique({
		where: { id: patientId },
	});

	if (!existingPatient) {
		return next(new AppError("Patient not found", 404));
	}

	const data = buildPatientPayload(req.body);

	const validationError = validatePatientPayload(data, next);
	if (validationError) return validationError;

	const patient = await prisma.patient.update({
		where: { id: patientId },
		data,
	});

	res.status(200).json({
		status: "success",
		data: { patient },
	});
});

exports.deletePatient = catchAsync(async (req, res, next) => {
	const patientId = toPositiveInt(req.params.id);

	if (!patientId) {
		return next(new AppError("Invalid patient ID", 400));
	}

	const existingPatient = await prisma.patient.findUnique({
		where: { id: patientId },
	});

	if (!existingPatient) {
		return next(new AppError("Patient not found", 404));
	}

	await prisma.$transaction(async (tx) => {
		const prescriptions = await tx.prescription.findMany({
			where: { patientId },
			select: { id: true },
		});

		const prescriptionIds = prescriptions.map((item) => item.id);

		const labOrders = await tx.labOrder.findMany({
			where: { patientId },
			select: { id: true },
		});

		const labOrderIds = labOrders.map((item) => item.id);

		if (labOrderIds.length > 0) {
			await tx.labOrderItem.deleteMany({
				where: {
					labOrderId: {
						in: labOrderIds,
					},
				},
			});

			await tx.labOrder.deleteMany({
				where: { patientId },
			});
		}

		if (prescriptionIds.length > 0) {
			await tx.prescriptionMedicine.deleteMany({
				where: {
					prescriptionId: {
						in: prescriptionIds,
					},
				},
			});

			await tx.prescription.deleteMany({
				where: { patientId },
			});
		}

		await tx.patient.delete({
			where: { id: patientId },
		});
	});

	logActivity({
		action: "DELETE_PATIENT",
		entity: "Patient",
		entityId: patientId,
		description: `مریض حذف شد: ${existingPatient.fullname || patientId}`,
		userId: req.user?.id,
		userName: req.user?.name,
		userRole: req.user?.role,
	});

	res.status(204).send();
});