import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";

export const afghanLocale = {
	name: "persian_af",
	months: [
		["حمل", "حمل"],
		["ثور", "ثور"],
		["جوزا", "جوز"],
		["سرطان", "سر"],
		["اسد", "اسد"],
		["سنبله", "سن"],
		["میزان", "می"],
		["عقرب", "عق"],
		["قوس", "قو"],
		["جدی", "جد"],
		["دلو", "دل"],
		["حوت", "حوت"],
	],
	weekDays: [
		["شنبه", "شن"],
		["یکشنبه", "یک"],
		["دوشنبه", "دو"],
		["سه‌شنبه", "سه"],
		["چهارشنبه", "چهار"],
		["پنجشنبه", "پنج"],
		["جمعه", "جم"],
	],
	digits: ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"],
	meridiems: [
		["قبل از ظهر", "ق.ظ"],
		["بعد از ظهر", "ب.ظ"],
	],
};

export const afghanCalendar = persian;

export function getTodayAfghanDate() {
	return new DateObject({
		date: new Date(),
		calendar: afghanCalendar,
		locale: afghanLocale,
	}).format("YYYY/MM/DD");
}

export function formatAfghanDate(date, { englishDigits = false, withMonthName = false } = {}) {
	if (!date) return "-";

	try {
		const parsed = date instanceof Date ? date : new Date(date);
		if (Number.isNaN(parsed.getTime())) return "-";

		const dateObj = new DateObject({
			date: parsed,
			calendar: afghanCalendar,
			locale: afghanLocale,
		});

		const formatted = withMonthName
			? dateObj.format("DD MMMM YYYY")
			: dateObj.format("YYYY/MM/DD");

		if (!englishDigits) return formatted;

		return formatted.replace(/[۰-۹]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹".indexOf(digit));
	} catch {
		return "-";
	}
}
