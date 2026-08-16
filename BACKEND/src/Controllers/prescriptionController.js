const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const prisma = require('../DBconfig/prisma');
const logActivity = require('../utils/logActivity');

exports.getLastPrescriptions = catchAsync(async (req, res, next) => {
	const prescriptions = await prisma.prescription.findMany({
		include: {
			patient: true,
			doctor: {
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
				},
			},
			medicines: true,
		},
		orderBy: { createdAt: 'desc' },
		take: 15,
	});

	res.status(200).json({
		status: 'success',
		results: prescriptions.length,
		data: { prescriptions },
	});
});

exports.getAllPrescriptions = catchAsync(async (req, res, next) => {
	const { role, id: userId } = req.user;

	// Pagination
	const page = parseInt(req.query.page) || 1;
	const limit = parseInt(req.query.limit) || 10;
	const skip = (page - 1) * limit;

	// Build where clause based on role
	const where = {};

	// Role-based filtering: Doctors see only their prescriptions
	if (role === 'Doctor') {
		where.doctorId = userId;
	}

	// Search by ID, prescription number, or patient name
	if (req.query.search) {
		const searchValue = req.query.search;
		const numericSearch = parseInt(searchValue, 10);
		const isNumericSearch = !Number.isNaN(numericSearch);

		where.OR = [
			{ prescriptionNo: { contains: searchValue } },
			{ patientName: { contains: searchValue } },
			...(isNumericSearch ? [{ id: numericSearch }] : []),
		];
	}

	// Filter by status
	if (req.query.status) {
		where.status = req.query.status;
	}

	// Filter by date range
	if (req.query.startDate || req.query.endDate) {
		where.date = {};
		if (req.query.startDate) {
			where.date.gte = new Date(req.query.startDate);
		}
		if (req.query.endDate) {
			where.date.lte = new Date(req.query.endDate);
		}
	}

	// Get total count for pagination
	const totalCount = await prisma.prescription.count({ where });

	// Get prescriptions with pagination
	const prescriptions = await prisma.prescription.findMany({
		where,
		include: {
			patient: true,
			doctor: {
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
				},
			},
			medicines: true,
		},
		orderBy: { createdAt: 'desc' },
		skip,
		take: limit,
	});

	res.status(200).json({
		status: 'success',
		results: prescriptions.length,
		totalCount,
		totalPages: Math.ceil(totalCount / limit),
		currentPage: page,
		data: { prescriptions },
	});
});

exports.getPrescription = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const { role, id: userId } = req.user;

	const prescription = await prisma.prescription.findUnique({
		where: { id: parseInt(id) },
		include: {
			patient: true,
			doctor: {
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
				},
			},
			medicines: true,
			labOrders: {
				include: {
					items: {
						include: {
							labTest: true,
						},
					},
				},
			},
		},
	});

	if (!prescription) {
		return next(new AppError('Prescription not found', 404));
	}

	if (role === 'Doctor' && prescription.doctorId !== userId) {
		return next(new AppError('You do not have permission to view this prescription', 403));
	}

	res.status(200).json({
		status: 'success',
		data: { prescription },
	});
});

exports.createPrescription = catchAsync(async (req, res, next) => {
	const {
		patientId,
		doctorId,
		patientName,
		diagnosis,
		status,
		medicines,

		// These fields exist in your Prisma Prescription model
		pastHistory,
		investigation,
		notes,
		instructions,
		impression,
		drugHistory,
		bloodPressure,
		respiratoryRate,
		pulseRate,
		temperature,
		heartRate,
		spo2,
		clc,
	} = req.body;

	const parsedPatientId = Number(patientId);
	const parsedDoctorId = Number(doctorId);

	if (!parsedPatientId || Number.isNaN(parsedPatientId)) {
		return next(new AppError("Valid patientId is required", 400));
	}

	if (!parsedDoctorId || Number.isNaN(parsedDoctorId)) {
		return next(new AppError("Valid doctorId is required", 400));
	}

	const patient = await prisma.patient.findUnique({
		where: { id: parsedPatientId },
	});

	if (!patient) {
		return next(new AppError("Patient not found with this ID", 404));
	}

	const doctor = await prisma.user.findUnique({
		where: { id: parsedDoctorId },
	});

	if (!doctor) {
		return next(new AppError("Doctor not found with this ID", 404));
	}

	const safeStatus = String(status || "PENDING").toUpperCase();

	const allowedStatuses = ["PENDING", "VERIFIED", "DISPENSED", "REJECTED"];

	if (!allowedStatuses.includes(safeStatus)) {
		return next(new AppError("Invalid prescription status", 400));
	}

	const normalizeString = (value) => {
		if (value === undefined || value === null) return "";
		return String(value);
	};

	const normalizeOptionalString = (value) => {
		if (value === undefined || value === null) return null;
		const clean = String(value).trim();
		return clean === "" ? null : clean;
	};

	const normalizeAmount = (value) => {
		const parsed = Number.parseInt(value, 10);
		return Number.isNaN(parsed) ? 0 : parsed;
	};

	const normalizedMedicines = Array.isArray(medicines)
		? medicines
			.map((med) => ({
				name: normalizeString(med?.name).trim(),
				dosage: normalizeString(med?.dosage).trim(),
				frequency: normalizeString(med?.frequency).trim(),
				route: normalizeString(med?.route || med?.type).trim(),
				duration: normalizeString(med?.duration).trim(),
				instructions: normalizeString(med?.instructions).trim(),
				amount: normalizeAmount(med?.amount),
				mealTiming: normalizeOptionalString(med?.mealTiming),
			}))
			.filter(
				(med) =>
					med.name ||
					med.dosage ||
					med.frequency ||
					med.route ||
					med.duration ||
					med.instructions ||
					med.amount ||
					med.mealTiming
			)
		: [];

	const prescription = await prisma.$transaction(async (tx) => {
		const tempNo = `TMP-${Date.now()}-${Math.random()
			.toString(16)
			.slice(2)}`;

		const createData = {
			prescriptionNo: tempNo,

			patientName:
				normalizeString(patientName).trim() ||
				patient.fullname ||
				"Unknown Patient",

			diagnosis: normalizeString(diagnosis).trim(),
			status: safeStatus,

			patientId: parsedPatientId,
			doctorId: parsedDoctorId,

			pastHistory: normalizeOptionalString(pastHistory),
			investigation: normalizeOptionalString(investigation),
			notes: normalizeOptionalString(notes),
			instructions: normalizeOptionalString(instructions),
			impression: normalizeOptionalString(impression),
			drugHistory: normalizeOptionalString(drugHistory),

			bloodPressure: normalizeOptionalString(bloodPressure),
			respiratoryRate: normalizeOptionalString(respiratoryRate),
			pulseRate: normalizeOptionalString(pulseRate),
			temperature: normalizeOptionalString(temperature),
			heartRate: normalizeOptionalString(heartRate),
			spo2: normalizeOptionalString(spo2),
			clc: normalizeOptionalString(clc),
		};

		if (normalizedMedicines.length > 0) {
			createData.medicines = {
				create: normalizedMedicines,
			};
		}

		const created = await tx.prescription.create({
			data: createData,
		});

		const year = new Date().getFullYear();
		const generatedNo = `RX-${year}-${String(created.id).padStart(5, "0")}`;

		const updated = await tx.prescription.update({
			where: { id: created.id },
			data: {
				prescriptionNo: generatedNo,
			},
			include: {
				patient: true,
				doctor: {
					select: {
						id: true,
						name: true,
						email: true,
						role: true,
					},
				},
				medicines: true,
				labOrders: {
					include: {
						items: true,
					},
				},
			},
		});

		return updated;
	});

	try {
		const io = req.app.get("io");

		if (io) {
			const { EVENTS, ROOMS } = require("../socket/events");

			io.to(ROOMS.PHARMACY).emit(EVENTS.PRESCRIPTION_NEW, {
				prescription,
			});

			io.to(ROOMS.doctorRoom(prescription.doctorId)).emit(
				EVENTS.PRESCRIPTION_NEW,
				{
					prescription,
				}
			);
		}
	} catch (error) {
		console.error("Socket emit failed for prescription create:", error.message);
	}

	try {
		await logActivity({
			action: "CREATE_PRESCRIPTION",
			entity: "Prescription",
			entityId: prescription.id,
			description: `نسخه جدید صادر شد: ${prescription.prescriptionNo} برای مریض ${prescription.patientName}`,
			userId: req.user?.id,
			userName: req.user?.name,
			userRole: req.user?.role,
		});
	} catch (error) {
		console.error("Activity log failed for prescription create:", error.message);
	}

	res.status(201).json({
		status: "success",
		data: {
			prescription,
		},
	});
});

exports.updatePrescription = async (req, res) => {
	try {
		const prescriptionId = Number(req.params.id);

		if (!prescriptionId || Number.isNaN(prescriptionId)) {
			return res.status(400).json({
				status: "fail",
				message: "Invalid prescription ID",
			});
		}

		const existingPrescription = await prisma.prescription.findUnique({
			where: { id: prescriptionId },
			include: { medicines: true },
		});

		if (!existingPrescription) {
			return res.status(404).json({
				status: "fail",
				message: "Prescription not found",
			});
		}

		const normalizeString = (value) => {
			if (value === undefined || value === null) return "";
			return String(value);
		};

		const normalizeOptionalString = (value) => {
			if (value === undefined) return undefined;
			if (value === null) return null;

			const clean = String(value).trim();
			return clean === "" ? null : clean;
		};

		const normalizeAmount = (value) => {
			const parsed = Number.parseInt(value, 10);
			return Number.isNaN(parsed) ? 0 : parsed;
		};

		const {
			patientName,
			diagnosis,
			status,
			rejectionReason,

			pastHistory,
			investigation,
			notes,
			instructions,
			impression,
			drugHistory,

			bloodPressure,
			respiratoryRate,
			pulseRate,
			temperature,
			heartRate,
			spo2,
			clc,

			medicines,
		} = req.body;

		const data = {};

		if (patientName !== undefined) {
			data.patientName = normalizeString(patientName).trim();
		}

		if (diagnosis !== undefined) {
			data.diagnosis = normalizeString(diagnosis).trim();
		}

		if (status !== undefined) {
			const safeStatus = String(status).toUpperCase();
			const allowedStatuses = ["PENDING", "VERIFIED", "DISPENSED", "REJECTED"];

			if (!allowedStatuses.includes(safeStatus)) {
				return res.status(400).json({
					status: "fail",
					message: "Invalid prescription status",
				});
			}

			data.status = safeStatus;
		}

		if (rejectionReason !== undefined) {
			data.rejectionReason = normalizeOptionalString(rejectionReason);
		}

		const optionalFields = {
			pastHistory,
			investigation,
			notes,
			instructions,
			impression,
			drugHistory,
			bloodPressure,
			respiratoryRate,
			pulseRate,
			temperature,
			heartRate,
			spo2,
			clc,
		};

		Object.entries(optionalFields).forEach(([field, value]) => {
			if (value !== undefined) {
				data[field] = normalizeOptionalString(value);
			}
		});

		if (Array.isArray(medicines)) {
			const normalizedMedicines = medicines
				.map((medicine) => ({
					name: normalizeString(medicine?.name).trim(),
					dosage: normalizeString(medicine?.dosage).trim(),
					frequency: normalizeString(medicine?.frequency).trim(),
					route: normalizeString(medicine?.route || medicine?.type).trim(),
					duration: normalizeString(medicine?.duration).trim(),
					instructions: normalizeString(medicine?.instructions).trim(),
					amount: normalizeAmount(medicine?.amount),
					mealTiming:
						medicine?.mealTiming === undefined || medicine?.mealTiming === null
							? null
							: String(medicine.mealTiming).trim() || null,
				}))
				.filter(
					(medicine) =>
						medicine.name ||
						medicine.dosage ||
						medicine.frequency ||
						medicine.route ||
						medicine.duration ||
						medicine.instructions ||
						medicine.amount ||
						medicine.mealTiming
				);

			data.medicines = {
				deleteMany: {},
				create: normalizedMedicines,
			};
		}

		const prescription = await prisma.prescription.update({
			where: { id: prescriptionId },
			data,
			include: {
				patient: true,
				doctor: {
					select: {
						id: true,
						name: true,
						email: true,
						role: true,
					},
				},
				medicines: true,
				labOrders: {
					include: {
						items: true,
					},
				},
			},
		});

		return res.status(200).json({
			status: "success", // ← Fixed: Added the missing status value
			data: prescription,
		});
	} catch (error) {
		console.error("Error updating prescription:", error);
		return res.status(500).json({
			status: "error",
			message: "Internal server error",
		});
	}
};

exports.deletePrescription = catchAsync(async (req, res, next) => {
	const { id } = req.params;

	// Ensure related medicines are removed even if DB FK doesn't cascade
	await prisma.prescriptionMedicine.deleteMany({
		where: { prescriptionId: parseInt(id) },
	});

	await prisma.prescription.delete({
		where: { id: parseInt(id) },
	});

	res.status(204).json({
		status: 'success',
		data: null,
	});
});

exports.updatePrescriptionStatus = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const { status, rejectionReason } = req.body;

	if (!['PENDING', 'VERIFIED', 'DISPENSED', 'REJECTED'].includes(status)) {
		return next(new AppError('Invalid status. Must be PENDING, VERIFIED, DISPENSED, or REJECTED', 400));
	}

	if (status === 'REJECTED' && !rejectionReason?.trim()) {
		return next(new AppError('Rejection reason is required when rejecting a prescription', 400));
	}

	const prescription = await prisma.prescription.update({
		where: { id: parseInt(id) },
		data: {
			status,
			rejectionReason: status === 'REJECTED' ? rejectionReason.trim() : null,
		},
		include: {
			patient: true,
			doctor: {
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
				},
			},
			medicines: true,
		},
	});

	// Emit status update to pharmacy and doctor
	const io = req.app.get('io');
	try {
		const { EVENTS, ROOMS } = require('../socket/events');
		io.to(ROOMS.PHARMACY).emit(EVENTS.PRESCRIPTION_STATUS_UPDATE, { id: prescription.id, status });
		io.to(ROOMS.doctorRoom(prescription.doctorId)).emit(EVENTS.PRESCRIPTION_STATUS_UPDATE, { id: prescription.id, status });
	} catch (e) {
		// Silently ignore socket errors
	}

	res.status(200).json({
		status: 'success',
		data: { prescription },
	});
});
