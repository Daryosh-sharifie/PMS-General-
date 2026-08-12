// Utility functions

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export const toEnglishDigits = (value) => {
	if (value == null) return "";

	return String(value).replace(/[۰-۹٠-٩]/g, (digit) => {
		const persianIndex = PERSIAN_DIGITS.indexOf(digit);
		if (persianIndex !== -1) return String(persianIndex);

		const arabicIndex = ARABIC_DIGITS.indexOf(digit);
		if (arabicIndex !== -1) return String(arabicIndex);

		return digit;
	});
};

export const toPersianDigits = (value) => {
	if (value == null || value === "") return "";

	return String(value).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
};

/** Keep (text) readable in RTL — prevents bidi from mirroring to )( */
export const fixRtlParentheses = (text, isRtl = true) => {
	if (!isRtl || text == null || text === "") return text ?? "";

	return String(text).replace(/\(/g, "\uFF08").replace(/\)/g, "\uFF09");
};

export const splitParentheticalText = (text) => {
	if (text == null || text === "") return [];

	return String(text).split(/(\([^)]*\))/g).filter(Boolean);
};

export const isParentheticalSegment = (segment) => /^\([^)]*\)$/.test(segment);

export const parseLocalizedInt = (value) => {
	const normalized = toEnglishDigits(value).replace(/\D/g, "");
	return normalized ? parseInt(normalized, 10) : NaN;
};

export const AGE_UNIT_OPTIONS = [
	{
		value: "year",
		label: "سال",
		enLabel: "Year",
		enPluralLabel: "Years",
		faLabel: "سال",
	},
	{
		value: "month",
		label: "ماه",
		enLabel: "Month",
		enPluralLabel: "Months",
		faLabel: "ماه",
	},
	{
		value: "week",
		label: "هفته",
		enLabel: "Week",
		enPluralLabel: "Weeks",
		faLabel: "هفته",
	},
	{
		value: "day",
		label: "روز",
		enLabel: "Day",
		enPluralLabel: "Days",
		faLabel: "روز",
	},
];

const AGE_UNIT_MAP = {
	سال: "year",
	year: "year",
	years: "year",
	yr: "year",
	yrs: "year",

	ماه: "month",
	month: "month",
	months: "month",
	mo: "month",
	mos: "month",

	هفته: "week",
	week: "week",
	weeks: "week",
	wk: "week",
	wks: "week",

	روز: "day",
	day: "day",
	days: "day",
};

const getAgeUnit = (unit = "year") => {
	const normalized = String(unit || "year").trim().toLowerCase();
	return AGE_UNIT_OPTIONS.find((opt) => opt.value === normalized) || AGE_UNIT_OPTIONS[0];
};

export const formatPatientAge = (value, unit = "year") => {
	const cleanValue = toEnglishDigits(String(value ?? "")).replace(/[^\d.]/g, "");

	if (!cleanValue) return "";

	const cleanUnit = getAgeUnit(unit).value;

	// Save age in stable English format.
	// Display language is handled by displayPatientAge(age, language).
	return `${cleanValue} ${cleanUnit}`;
};

export const parsePatientAge = (age) => {
	const raw = toEnglishDigits(String(age ?? "")).trim();

	if (!raw) {
		return {
			value: "",
			unit: "year",
		};
	}

	const match = raw.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);

	if (!match) {
		return {
			value: raw.replace(/[^\d.]/g, ""),
			unit: "year",
		};
	}

	const value = match[1];
	const unitPart = match[2].trim().toLowerCase();

	if (!unitPart) {
		return {
			value,
			unit: "year",
		};
	}

	for (const [key, unit] of Object.entries(AGE_UNIT_MAP)) {
		if (unitPart.includes(key)) {
			return {
				value,
				unit,
			};
		}
	}

	return {
		value,
		unit: "year",
	};
};

export const displayPatientAge = (age, language = "fa") => {
	if (age === undefined || age === null || age === "") return "-";

	const parsed = parsePatientAge(age);

	if (!parsed.value) return "-";

	const unit = getAgeUnit(parsed.unit);
	const numericValue = Number(parsed.value);

	if (language === "fa") {
		return `${toPersianDigits(parsed.value)} ${unit.faLabel}`;
	}

	const englishUnit = numericValue === 1 ? unit.enLabel : unit.enPluralLabel;

	return `${parsed.value} ${englishUnit}`;
};

export const PRESCRIPTION_STATUS_LABEL_KEYS = {
	pending: "pending",
	verified: "verified",
	dispensed: "dispensed",
	rejected: "rejected",
	requested: "requested",
	in_progress: "inProgress",
	partial_completed: "partialCompleted",
	completed: "completed",
	cancelled: "cancelled",
};

export const getStatusLabel = (status, t = null) => {
	const normalized = String(status || "").toLowerCase();

	const labelKey = PRESCRIPTION_STATUS_LABEL_KEYS[normalized];

	if (t && labelKey) return t(labelKey);

	return labelKey || "notAssigned";
};

export const getStatusColor = (status) => {
	const normalized = String(status || "").toLowerCase();

	const colors = {
		pending: "bg-amber-100 text-amber-800 border-amber-200",
		verified: "bg-emerald-100 text-emerald-800 border-emerald-200",
		dispensed: "bg-blue-100 text-blue-800 border-blue-200",
		rejected: "bg-red-100 text-red-800 border-red-200",
		requested: "bg-amber-100 text-amber-800 border-amber-200",
		in_progress: "bg-blue-100 text-blue-800 border-blue-200",
		partial_completed: "bg-indigo-100 text-indigo-800 border-indigo-200",
		completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
		cancelled: "bg-red-100 text-red-800 border-red-200",
	};

	return colors[normalized] || "bg-gray-100 text-gray-800 border-gray-200";
};

export const formatDate = (dateString, language = "en") => {
	if (!dateString) return "-";

	const date = new Date(dateString);

	if (Number.isNaN(date.getTime())) return "-";

	const formatted = date.toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});

	return language === "fa" ? toPersianDigits(formatted) : formatted;
};