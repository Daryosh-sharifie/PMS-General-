const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const prisma = require("../dbConfig/prisma");
const path = require("path");

const DEFAULT_SETTING_ID = 1;

const DEFAULT_APP_SETTING = {
	id: DEFAULT_SETTING_ID,
	hospitalName: "Hospital",
	phone1: "",
	phone2: "",
	address: "",
	logo: null,
};

const buildFileUrl = (req, relativePath) => {
	if (!relativePath) return null;

	const normalized = String(relativePath).replace(/\\/g, "/");

	if (
		normalized.startsWith("http://") ||
		normalized.startsWith("https://")
	) {
		return normalized;
	}

	return `${req.protocol}://${req.get("host")}${normalized}`;
};

const withLogoUrl = (req, setting) => {
	if (!setting) return setting;

	return {
		...setting,
		logo: setting.logo ? buildFileUrl(req, setting.logo) : null,
	};
};

const getLogoPath = (file) => {
	if (!file?.filename) return undefined;

	// Do not use path.join for URL paths because Windows can create backslashes.
	return `/uploads/logos/${file.filename}`;
};

const findSetting = async () => {
	return prisma.appSetting.findUnique({
		where: { id: DEFAULT_SETTING_ID },
	});
};

const getOrCreateSetting = async () => {
	const existing = await findSetting();

	if (existing) return existing;

	return prisma.appSetting.create({
		data: DEFAULT_APP_SETTING,
	});
};

exports.getAppSetting = catchAsync(async (req, res) => {
	const appSetting = await getOrCreateSetting();

	res.status(200).json({
		status: "success",
		data: {
			appSetting: withLogoUrl(req, appSetting),
		},
	});
});

exports.createAppSetting = catchAsync(async (req, res, next) => {
	const existing = await findSetting();

	if (existing) {
		return next(new AppError("App setting already exists; update it instead", 409));
	}

	const data = {
		id: DEFAULT_SETTING_ID,
		hospitalName: req.body?.hospitalName || DEFAULT_APP_SETTING.hospitalName,
		phone1: req.body?.phone1 || DEFAULT_APP_SETTING.phone1,
		phone2: req.body?.phone2 || DEFAULT_APP_SETTING.phone2,
		address: req.body?.address || DEFAULT_APP_SETTING.address,
	};

	const logoPath = getLogoPath(req.file);
	if (logoPath) data.logo = logoPath;

	const appSetting = await prisma.appSetting.create({ data });

	res.status(201).json({
		status: "success",
		data: {
			appSetting: withLogoUrl(req, appSetting),
		},
	});
});

exports.updateAppSetting = catchAsync(async (req, res) => {
	const data = {};

	if (req.body?.hospitalName !== undefined) {
		data.hospitalName = req.body.hospitalName;
	}

	if (req.body?.phone1 !== undefined) {
		data.phone1 = req.body.phone1;
	}

	if (req.body?.phone2 !== undefined) {
		data.phone2 = req.body.phone2 || "";
	}

	if (req.body?.address !== undefined) {
		data.address = req.body.address;
	}

	const logoPath = getLogoPath(req.file);
	if (logoPath) data.logo = logoPath;

	const appSetting = await prisma.appSetting.upsert({
		where: { id: DEFAULT_SETTING_ID },
		create: {
			...DEFAULT_APP_SETTING,
			...data,
		},
		update: data,
	});

	res.status(200).json({
		status: "success",
		data: {
			appSetting: withLogoUrl(req, appSetting),
		},
	});
});

exports.deleteAppSetting = catchAsync(async (req, res, next) => {
	const existing = await findSetting();

	if (!existing) {
		return next(new AppError("App setting not found to delete", 404));
	}

	await prisma.appSetting.delete({
		where: { id: DEFAULT_SETTING_ID },
	});

	res.status(204).json({
		status: "success",
		data: null,
	});
});

exports.uploadLogo = catchAsync(async (req, res, next) => {
	if (!req.file) {
		return next(new AppError("No file uploaded", 400));
	}

	const logoPath = getLogoPath(req.file);

	const appSetting = await prisma.appSetting.upsert({
		where: { id: DEFAULT_SETTING_ID },
		create: {
			...DEFAULT_APP_SETTING,
			logo: logoPath,
		},
		update: {
			logo: logoPath,
		},
	});

	res.status(200).json({
		status: "success",
		message: "Logo uploaded successfully",
		data: {
			appSetting: withLogoUrl(req, appSetting),
		},
	});
});