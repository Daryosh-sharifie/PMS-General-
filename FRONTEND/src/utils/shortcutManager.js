export const DEFAULT_SHORTCUTS = [
	{
		id: "addPatient",
		labelFa: "ایجاد بیمار جدید",
		labelEn: "Create New Patient",
		modifier: "Alt",
		key: "M",
		descriptionFa: "انتقال به صفحه ثبت بیمار جدید",
		descriptionEn: "Go to Create New Patient page",
	},
	{
		id: "createPrescription",
		labelFa: "ایجاد نسخه جدید",
		labelEn: "Create New Prescription",
		modifier: "Alt",
		key: "N",
		descriptionFa: "انتقال به صفحه ثبت نسخه جدید",
		descriptionEn: "Go to Create New Prescription page",
	},
	{
		id: "laboratory",
		labelFa: "دواخانه / لابراتوار",
		labelEn: "Laboratory",
		modifier: "Alt",
		key: "L",
		descriptionFa: "انتقال به بخش نتایج و راپورهای لابراتوار",
		descriptionEn: "Go to Laboratory & Lab Reports",
	},
	{
		id: "reports",
		labelFa: "راپورها / گزارش‌ها",
		labelEn: "Reports",
		modifier: "Alt",
		key: "R",
		descriptionFa: "انتقال به صفحه گزارش‌ها و آمار",
		descriptionEn: "Go to Reports & Analytics page",
	},
	{
		id: "printPrescription",
		labelFa: "چاپ نسخه",
		labelEn: "Print Prescription",
		modifier: "Ctrl",
		key: "Space",
		descriptionFa: "چاپ نسخه فعال در صفحه مشاهده یا فرم نسخه",
		descriptionEn: "Print active prescription in Detail or Form page",
	},
];

const STORAGE_KEY = "app_shortcuts";

export function getShortcuts() {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return DEFAULT_SHORTCUTS;
		const parsed = JSON.parse(stored);
		if (!Array.isArray(parsed)) return DEFAULT_SHORTCUTS;

		return DEFAULT_SHORTCUTS.map((def) => {
			const found = parsed.find((item) => item.id === def.id);
			if (!found) return def;
			return {
				...def,
				modifier: found.modifier || def.modifier,
				key: found.key || def.key,
			};
		});
	} catch {
		return DEFAULT_SHORTCUTS;
	}
}

export function saveShortcuts(shortcuts) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
		window.dispatchEvent(new Event("app-shortcuts-updated"));
	} catch (e) {
		console.error("Failed to save shortcuts:", e);
	}
}

export function resetShortcuts() {
	try {
		localStorage.removeItem(STORAGE_KEY);
		window.dispatchEvent(new Event("app-shortcuts-updated"));
	} catch (e) {
		console.error("Failed to reset shortcuts:", e);
	}
	return DEFAULT_SHORTCUTS;
}

export function getShortcutById(id) {
	const all = getShortcuts();
	return all.find((item) => item.id === id) || DEFAULT_SHORTCUTS.find((item) => item.id === id);
}

export function matchesShortcut(event, shortcutConfig) {
	if (!shortcutConfig || !event) return false;
	const { modifier, key } = shortcutConfig;
	if (!modifier || !key) return false;

	const targetModifier = String(modifier).trim().toLowerCase();
	const targetKey = String(key).trim().toLowerCase();

	const isAltExpected = targetModifier.includes("alt");
	const isCtrlExpected = targetModifier.includes("ctrl");
	const isShiftExpected = targetModifier.includes("shift");

	if (isAltExpected && !event.altKey) return false;
	if (isCtrlExpected && (!event.ctrlKey && !event.metaKey)) return false;
	if (isShiftExpected && !event.shiftKey) return false;

	if (!isAltExpected && event.altKey) return false;
	if (!isCtrlExpected && (event.ctrlKey || event.metaKey)) return false;

	const eventKey = (event.key || "").toLowerCase();
	const eventCode = (event.code || "").toLowerCase();

	if (targetKey === "space") {
		return eventKey === " " || eventKey === "space" || eventCode === "space" || event.keyCode === 32;
	}

	return (
		eventKey === targetKey ||
		eventCode === `key${targetKey}` ||
		eventCode === targetKey
	);
}

export function formatShortcut(shortcut) {
	if (!shortcut) return "";
	const mod = shortcut.modifier ? shortcut.modifier.trim() : "";
	const k = shortcut.key ? shortcut.key.trim() : "";
	return `${mod} + ${k}`;
}

export function getShortcutTooltip(shortcutId, actionName, language = "fa") {
	const sc = getShortcutById(shortcutId);
	if (!sc) return actionName || "";
	const combo = formatShortcut(sc);
	const isRtl = language === "fa";

	if (isRtl) {
		const label = actionName || sc.labelFa;
		return `برای ${label}: ${combo}`;
	}

	const label = actionName || sc.labelEn;
	return `For ${label.toLowerCase()}: ${combo}`;
}
