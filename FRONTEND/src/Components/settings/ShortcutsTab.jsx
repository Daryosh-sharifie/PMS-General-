import { useState, useEffect } from "react";
import { Keyboard, RefreshCw, Edit3, CheckCircle, AlertTriangle, X } from "lucide-react";
import { Card, CardHeader, CardContent } from "../ui/Card";
import { buttonPrimary, buttonSecondary } from "../../constants/styles";
import {
	getShortcuts,
	saveShortcuts,
	resetShortcuts,
	formatShortcut,
} from "../../utils/shortcutManager";
import { useLanguage } from "../../i18n/LanguageContext";

export default function ShortcutsTab({ showMessage }) {
	const { t, language } = useLanguage();
	const isRtl = language === "fa";

	const [shortcuts, setShortcuts] = useState(() => getShortcuts());
	const [editingId, setEditingId] = useState(null);
	const [recordedKey, setRecordedKey] = useState(null);

	useEffect(() => {
		const handleUpdate = () => {
			setShortcuts(getShortcuts());
		};
		window.addEventListener("app-shortcuts-updated", handleUpdate);
		return () => {
			window.removeEventListener("app-shortcuts-updated", handleUpdate);
		};
	}, []);

	// Handle Recording Keypresses
	useEffect(() => {
		if (!editingId) return;

		const handleKeyDown = (e) => {
			e.preventDefault();
			e.stopPropagation();

			// Skip standalone modifier keys
			if (["Control", "Alt", "Shift", "Meta"].includes(e.key)) {
				return;
			}

			// Determine primary modifier
			let modifier = "Alt";
			if (e.ctrlKey || e.metaKey) {
				modifier = "Ctrl";
			} else if (e.altKey) {
				modifier = "Alt";
			} else if (e.shiftKey) {
				modifier = "Shift";
			}

			let key = e.key ? e.key.toUpperCase() : "";
			if (e.code === "Space" || e.key === " " || key === "SPACE") {
				key = "Space";
			}

			setRecordedKey({ modifier, key });
		};

		window.addEventListener("keydown", handleKeyDown, true);
		return () => {
			window.removeEventListener("keydown", handleKeyDown, true);
		};
	}, [editingId]);

	const handleSaveEdit = () => {
		if (!editingId || !recordedKey) return;

		// Check for duplicates
		const conflict = shortcuts.find(
			(s) =>
				s.id !== editingId &&
				s.modifier.toLowerCase() === recordedKey.modifier.toLowerCase() &&
				s.key.toLowerCase() === recordedKey.key.toLowerCase()
		);

		if (conflict) {
			const label = isRtl ? conflict.labelFa : conflict.labelEn;
			showMessage?.(
				isRtl
					? `این ترکیب کلید برای "${label}" استفاده شده است!`
					: `This shortcut is already used for "${label}"!`,
				"error"
			);
			return;
		}

		const updated = shortcuts.map((s) =>
			s.id === editingId
				? { ...s, modifier: recordedKey.modifier, key: recordedKey.key }
				: s
		);

		setShortcuts(updated);
		saveShortcuts(updated);
		setEditingId(null);
		setRecordedKey(null);

		showMessage?.(
			isRtl
				? "کلید میانبر با موفقیت تغییر یافت"
				: "Keyboard shortcut updated successfully",
			"success"
		);
	};

	const handleResetAll = () => {
		const defaults = resetShortcuts();
		setShortcuts(defaults);
		setEditingId(null);
		setRecordedKey(null);
		showMessage?.(
			isRtl
				? "تمام کلیدهای میانبر به حالت اولیه بازگشتند"
				: "All shortcuts restored to default",
			"success"
		);
	};

	const startEditing = (shortcut) => {
		setEditingId(shortcut.id);
		setRecordedKey({ modifier: shortcut.modifier, key: shortcut.key });
	};

	const cancelEditing = () => {
		setEditingId(null);
		setRecordedKey(null);
	};

	return (
		<Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
			<CardHeader className="border-b border-slate-100 px-6 py-5">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" dir={isRtl ? "rtl" : "ltr"}>
					<div className={isRtl ? "text-right" : "text-left"}>
						<h3 className="text-xl font-bold text-slate-950">
							{isRtl ? "کلیدهای میانبر (Shortcuts)" : "Keyboard Shortcuts"}
						</h3>
						<p className="mt-1 text-sm text-slate-500">
							{isRtl
								? "لیست کلیدهای میانبر سیستم و قابلیت تغییر کلیدها"
								: "View and customize application keyboard shortcuts."}
						</p>
					</div>

					<button
						type="button"
						onClick={handleResetAll}
						className={`${buttonSecondary} shrink-0 justify-center`}
					>
						<RefreshCw className={`${isRtl ? "ml-2" : "mr-2"} h-4 w-4`} />
						{isRtl ? "بازنشانی به حالت اولیه" : "Reset to Defaults"}
					</button>
				</div>
			</CardHeader>

			<CardContent className="space-y-4 p-6" dir={isRtl ? "rtl" : "ltr"}>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					{shortcuts.map((sc) => {
						const label = isRtl ? sc.labelFa : sc.labelEn;
						const desc = isRtl ? sc.descriptionFa : sc.descriptionEn;
						const isEditing = editingId === sc.id;

						return (
							<div
								key={sc.id}
								className={`flex flex-col justify-between rounded-2xl border p-5 transition ${
									isEditing
										? "border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20"
										: "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50"
								}`}
							>
								<div className="flex items-start justify-between gap-3">
									<div className={isRtl ? "text-right" : "text-left"}>
										<p className="font-bold text-slate-900">{label}</p>
										<p className="mt-1 text-xs text-slate-500">{desc}</p>
									</div>

									<div className="flex shrink-0 items-center gap-1.5 dir-ltr">
										<kbd className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-800 shadow-xs">
											{sc.modifier}
										</kbd>
										<span className="text-slate-400 font-semibold">+</span>
										<kbd className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-800 shadow-xs">
											{sc.key}
										</kbd>
									</div>
								</div>

								<div className="mt-4 flex items-center justify-end border-t border-slate-200/60 pt-3">
									<button
										type="button"
										onClick={() => startEditing(sc)}
										className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition"
									>
										<Edit3 className="h-3.5 w-3.5" />
										{isRtl ? "تغییر کلید" : "Change Shortcut"}
									</button>
								</div>
							</div>
						);
					})}
				</div>

				{/* Editing Modal / Overlay */}
				{editingId && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
						<div
							className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl transition"
							dir={isRtl ? "rtl" : "ltr"}
						>
							<div className="flex items-center justify-between border-b border-slate-100 pb-4">
								<div className="flex items-center gap-2">
									<Keyboard className="h-5 w-5 text-blue-600" />
									<h4 className="text-lg font-bold text-slate-900">
										{isRtl ? "تغییر کلید میانبر" : "Edit Shortcut"}
									</h4>
								</div>
								<button
									type="button"
									onClick={cancelEditing}
									className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
								>
									<X className="h-5 w-5" />
								</button>
							</div>

							<div className="my-6 text-center space-y-4">
								<p className="text-sm font-medium text-slate-600">
									{isRtl
										? `کلید جدید برای "${
												shortcuts.find((s) => s.id === editingId)?.[
													isRtl ? "labelFa" : "labelEn"
												]
										  }" را فشار دهید:`
										: `Press new keys for "${
												shortcuts.find((s) => s.id === editingId)?.[
													isRtl ? "labelFa" : "labelEn"
												]
										  }":`}
								</p>

								<div className="flex items-center justify-center gap-2 py-4">
									{recordedKey ? (
										<div className="flex items-center gap-2 dir-ltr">
											<kbd className="inline-flex h-12 min-w-[50px] items-center justify-center rounded-xl border-2 border-blue-500 bg-blue-50 px-4 text-base font-extrabold text-blue-700 shadow-md animate-bounce-subtle">
												{recordedKey.modifier}
											</kbd>
											<span className="text-xl font-bold text-slate-400">+</span>
											<kbd className="inline-flex h-12 min-w-[50px] items-center justify-center rounded-xl border-2 border-blue-500 bg-blue-50 px-4 text-base font-extrabold text-blue-700 shadow-md animate-bounce-subtle">
												{recordedKey.key}
											</kbd>
										</div>
									) : (
										<div className="rounded-xl border-2 border-dashed border-slate-300 p-4 text-xs font-semibold text-slate-400 animate-pulse">
											{isRtl ? "در حال ضبط... کلیدهای مورد نظر را فشار دهید" : "Recording... press key combination"}
										</div>
									)}
								</div>

								<p className="text-xs text-slate-400">
									{isRtl
										? "پشتیبانی از ترکیب کلیدها مانند Alt, Ctrl, Shift به همراه حرف یا کلید Space"
										: "Supports Alt, Ctrl, Shift combined with any key or Space"}
								</p>
							</div>

							<div className="flex gap-3 pt-2">
								<button
									type="button"
									onClick={handleSaveEdit}
									disabled={!recordedKey}
									className={`${buttonPrimary} flex-1 justify-center disabled:opacity-50`}
								>
									<CheckCircle className={`${isRtl ? "ml-2" : "mr-2"} h-4 w-4`} />
									{isRtl ? "ذخیره تغییرات" : "Save Shortcut"}
								</button>
								<button
									type="button"
									onClick={cancelEditing}
									className={`${buttonSecondary} flex-1 justify-center`}
								>
									{isRtl ? "انصراف" : "Cancel"}
								</button>
							</div>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
