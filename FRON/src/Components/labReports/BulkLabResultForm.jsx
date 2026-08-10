import { useEffect, useMemo, useState } from "react";
import LabStatusBadge from "./LabStatusBadge";
import { formatDate } from "../../utils/helpers";

const EDITABLE_STATUSES = ["REQUESTED", "IN_PROGRESS", "COMPLETED"];

function normalizeTemplate(templateSnapshot) {
	if (!templateSnapshot) return [];

	if (Array.isArray(templateSnapshot)) {
		return templateSnapshot;
	}

	if (typeof templateSnapshot === "string") {
		try {
			const parsed = JSON.parse(templateSnapshot);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}

	return [];
}

function normalizeManualResults(manualResults) {
	if (!manualResults) return {};

	if (typeof manualResults === "string") {
		try {
			const parsed = JSON.parse(manualResults);
			return parsed && typeof parsed === "object" ? parsed : {};
		} catch {
			return {};
		}
	}

	return manualResults;
}

function getDefaultValue(field, existingValue) {
	if (existingValue !== undefined && existingValue !== null) {
		return existingValue;
	}

	if (field?.type === "checkbox") {
		return false;
	}

	return "";
}

function buildInitialState(order) {
	const initial = {};

	(order?.items || []).forEach((item) => {
		const template = normalizeTemplate(item.templateSnapshot);
		const manualResults = normalizeManualResults(item.manualResults);
		const itemResults = {};

		template.forEach((field) => {
			if (!field?.key) return;
			itemResults[field.key] = getDefaultValue(field, manualResults[field.key]);
		});

		initial[item.id] = {
			manualResults: itemResults,
			remarks: item.remarks || "",
		};
	});

	return initial;
}

function getPatientName(order) {
	return order?.patientName || order?.patient?.fullname || order?.patient?.name || "-";
}

function getPatientAge(order) {
	return order?.patientAge || order?.patient?.age || "-";
}

function getPatientGender(order) {
	return order?.patientGender || order?.patient?.gender || "-";
}

function getDoctorName(order) {
	return order?.doctorName || order?.requestedBy?.name || order?.doctor?.name || "-";
}

function getPrescriptionNo(order) {
	return order?.prescriptionNo || order?.prescription?.prescriptionNo || "-";
}

function FieldInput({ field, value, disabled, onChange }) {
	const inputClass =
		"w-full border-0 bg-transparent px-3 py-2 text-sm text-slate-900 outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

	if (field.type === "textarea") {
		return (
			<textarea
				value={value || ""}
				disabled={disabled}
				onChange={(e) => onChange(e.target.value)}
				rows={2}
				placeholder={field.placeholder || ""}
				className={`${inputClass} resize-y`}
			/>
		);
	}

	if (field.type === "select") {
		const options = Array.isArray(field.options) ? field.options : [];

		return (
			<select
				value={value || ""}
				disabled={disabled}
				onChange={(e) => onChange(e.target.value)}
				className={inputClass}
			>
				<option value="">Select</option>
				{options.map((option) => {
					const optionValue =
						typeof option === "object" ? option.value || option.label : option;
					const optionLabel =
						typeof option === "object" ? option.label || option.value : option;

					return (
						<option key={optionValue} value={optionValue}>
							{optionLabel}
						</option>
					);
				})}
			</select>
		);
	}

	if (field.type === "checkbox") {
		return (
			<label className="flex items-center justify-center gap-2 py-2 text-sm text-slate-700">
				<input
					type="checkbox"
					checked={Boolean(value)}
					disabled={disabled}
					onChange={(e) => onChange(e.target.checked)}
					className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
				/>
				<span>{value ? "Yes" : "No"}</span>
			</label>
		);
	}

	return (
		<input
			type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
			value={value || ""}
			disabled={disabled}
			onChange={(e) => onChange(e.target.value)}
			placeholder={field.placeholder || ""}
			className={inputClass}
		/>
	);
}

export default function BulkLabResultForm({
	open,
	order,
	saving = false,
	onSaveAll,
	onClose,
}) {
	const [activeIndex, setActiveIndex] = useState(0);
	const [resultsByItemId, setResultsByItemId] = useState(() => buildInitialState(order));

	useEffect(() => {
		setResultsByItemId(buildInitialState(order));
		setActiveIndex(0);
	}, [order]);

	useEffect(() => {
		if (!open) return;

		const handleEscape = (event) => {
			if (event.key === "Escape") {
				onClose?.();
			}
		};

		window.addEventListener("keydown", handleEscape);
		return () => window.removeEventListener("keydown", handleEscape);
	}, [open, onClose]);

	const items = order?.items || [];
	const activeItem = items[activeIndex] || null;

	const editableItems = useMemo(() => {
		return items.filter((item) => EDITABLE_STATUSES.includes(item.status));
	}, [items]);

	const hasEditableItems = editableItems.length > 0;

	const activeTemplate = normalizeTemplate(activeItem?.templateSnapshot);
	const activeState = activeItem
		? resultsByItemId[activeItem.id] || { manualResults: {}, remarks: "" }
		: { manualResults: {}, remarks: "" };

	const activeReadOnly = activeItem
		? !EDITABLE_STATUSES.includes(activeItem.status)
		: true;

	const updateFieldValue = (itemId, fieldKey, value) => {
		setResultsByItemId((prev) => ({
			...prev,
			[itemId]: {
				...(prev[itemId] || {}),
				manualResults: {
					...(prev[itemId]?.manualResults || {}),
					[fieldKey]: value,
				},
			},
		}));
	};

	const updateRemarks = (itemId, value) => {
		setResultsByItemId((prev) => ({
			...prev,
			[itemId]: {
				...(prev[itemId] || {}),
				remarks: value,
			},
		}));
	};

	const getSinglePayload = () => {
		if (!activeItem) return {};
		return {
			[activeItem.id]: resultsByItemId[activeItem.id] || {
				manualResults: {},
				remarks: "",
			},
		};
	};

	const handleSaveCurrent = () => {
		if (!activeItem || activeReadOnly) return;
		onSaveAll?.(getSinglePayload());
	};

	const handleSaveAndNext = async () => {
		if (!activeItem || activeReadOnly) return;
		await onSaveAll?.(getSinglePayload());

		if (activeIndex < items.length - 1) {
			setActiveIndex((prev) => prev + 1);
		}
	};

	const handleSaveAll = () => {
		onSaveAll?.(resultsByItemId);
	};

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 print:hidden">
			<div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
				<div className="shrink-0 border-b border-slate-200 bg-white px-5 py-4">
					<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
						<div className="flex flex-wrap items-center gap-2">
							<button
								type="button"
								onClick={onClose}
								disabled={saving}
								className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
							>
								Close
							</button>

							<button
								type="button"
								onClick={handleSaveCurrent}
								disabled={saving || !activeItem || activeReadOnly}
								className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{saving ? "Saving..." : "Save Current"}
							</button>

							<button
								type="button"
								onClick={handleSaveAndNext}
								disabled={saving || !activeItem || activeReadOnly}
								className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
							>
								Save & Next
							</button>

							<button
								type="button"
								onClick={handleSaveAll}
								disabled={saving || !hasEditableItems}
								className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{saving ? "Saving..." : "Save All Results"}
							</button>
						</div>

						<div className="text-right">
							<h2 className="text-xl font-bold text-slate-950">
								Blood Test Lab Result Form
							</h2>
							<p className="text-xs text-slate-500">
								One test at a time. Less scrolling, faster entry, cleaner workflow.
							</p>
						</div>
					</div>
				</div>

				<div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[280px_1fr]">
					<aside className="min-h-0 overflow-y-auto border-b border-slate-200 bg-slate-50 p-4 lg:border-b-0 lg:border-r">
						<div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
							<p className="font-bold text-slate-900">Lab No</p>
							<p className="mb-2 text-slate-600">{order?.labOrderNo || "-"}</p>

							<p className="font-bold text-slate-900">Patient</p>
							<p className="mb-2 text-slate-600">{getPatientName(order)}</p>

							<p className="font-bold text-slate-900">Doctor</p>
							<p className="mb-2 text-slate-600">{getDoctorName(order)}</p>

							<p className="font-bold text-slate-900">Prescription</p>
							<p className="text-slate-600">{getPrescriptionNo(order)}</p>
						</div>

						<div className="mt-4">
							<p className="mb-2 text-right text-sm font-bold text-slate-900">
								Assigned Tests
							</p>

							<div className="space-y-2">
								{items.map((item, index) => {
									const isActive = index === activeIndex;

									return (
										<button
											key={item.id}
											type="button"
											onClick={() => setActiveIndex(index)}
											className={`w-full rounded-xl border px-3 py-3 text-right transition ${
												isActive
													? "border-blue-300 bg-blue-50"
													: "border-slate-200 bg-white hover:bg-slate-50"
											}`}
										>
											<p className="truncate text-sm font-bold text-slate-900">
												{item.testNameSnapshot || "Lab Test"}
											</p>
											<div className="mt-2 flex items-center justify-between gap-2">
												<LabStatusBadge status={item.status} type="item" />
												<span className="truncate text-xs text-slate-500">
													{item.categorySnapshot || "General"}
												</span>
											</div>
										</button>
									);
								})}
							</div>
						</div>
					</aside>

					<main className="min-h-0 overflow-y-auto p-4 md:p-6">
						<div className="rounded-xl border border-slate-300 bg-white">
							<div className="border-b border-slate-300 bg-slate-100 px-4 py-2 text-sm font-bold text-slate-900">
								Patient information
							</div>

							<div className="grid grid-cols-1 text-sm md:grid-cols-2">
								<div className="border-b border-slate-200 px-4 py-2 md:border-r">
									<span className="font-semibold">Name: </span>
									{getPatientName(order)}
								</div>
								<div className="border-b border-slate-200 px-4 py-2">
									<span className="font-semibold">Age: </span>
									{getPatientAge(order)}
								</div>
								<div className="border-b border-slate-200 px-4 py-2 md:border-r">
									<span className="font-semibold">Gender: </span>
									{getPatientGender(order)}
								</div>
								<div className="border-b border-slate-200 px-4 py-2">
									<span className="font-semibold">Order date: </span>
									{formatDate(order?.createdAt)}
								</div>
							</div>
						</div>

						{!activeItem ? (
							<div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
								No lab test selected.
							</div>
						) : (
							<div className="mt-4 rounded-xl border border-slate-300 bg-white">
								<div className="flex flex-col gap-2 border-b border-slate-300 bg-slate-100 px-4 py-3 md:flex-row md:items-center md:justify-between">
									<div>
										<h3 className="text-lg font-bold text-slate-950">
											{activeItem.testNameSnapshot || "Lab Test"}
										</h3>
										<p className="text-xs text-slate-500">
											{activeItem.categorySnapshot || "General"}
										</p>
									</div>

									<div className="flex items-center gap-2">
										<LabStatusBadge status={activeItem.status} type="item" />
										{activeReadOnly && (
											<span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
												Read only
											</span>
										)}
									</div>
								</div>

								{activeTemplate.length > 0 ? (
									<div className="overflow-x-auto">
										<table className="w-full min-w-[720px] text-sm">
											<thead>
												<tr className="bg-white text-slate-700">
													<th className="w-[30%] border-b border-r border-slate-200 px-3 py-2 text-left">
														Test Parameter
													</th>
													<th className="w-[30%] border-b border-r border-slate-200 px-3 py-2 text-left">
														Result Value
													</th>
													<th className="w-[18%] border-b border-r border-slate-200 px-3 py-2 text-left">
														Unit
													</th>
													<th className="w-[22%] border-b border-slate-200 px-3 py-2 text-left">
														Normal Range
													</th>
												</tr>
											</thead>

											<tbody>
												{activeTemplate.map((field) => {
													if (!field?.key) return null;

													const value = activeState.manualResults?.[field.key];

													return (
														<tr key={field.key}>
															<td className="border-b border-r border-slate-200 px-3 py-2 font-semibold text-slate-800">
																{field.label || field.key}
																{field.required && (
																	<span className="ml-1 text-rose-500">*</span>
																)}
															</td>

															<td className="border-b border-r border-slate-200 p-0">
																<FieldInput
																	field={field}
																	value={value}
																	disabled={saving || activeReadOnly}
																	onChange={(nextValue) =>
																		updateFieldValue(
																			activeItem.id,
																			field.key,
																			nextValue
																		)
																	}
																/>
															</td>

															<td className="border-b border-r border-slate-200 px-3 py-2 text-slate-700">
																{field.unit || "-"}
															</td>

															<td className="border-b border-slate-200 px-3 py-2 text-slate-700">
																{field.normalRange || field.referenceRange || "-"}
															</td>
														</tr>
													);
												})}
											</tbody>
										</table>
									</div>
								) : (
									<div className="px-4 py-6 text-center text-sm text-slate-500">
										No result template found for this test.
									</div>
								)}

								<div className="px-4 py-4">
									<label className="mb-1 block text-sm font-semibold text-slate-800">
										Remarks
									</label>
									<textarea
										value={activeState.remarks || ""}
										disabled={saving || activeReadOnly}
										onChange={(e) => updateRemarks(activeItem.id, e.target.value)}
										rows={3}
										placeholder="Enter remarks for this test"
										className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
									/>
								</div>
							</div>
						)}
					</main>
				</div>

				<div className="shrink-0 border-t border-slate-200 bg-white px-5 py-3">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<p className="text-sm text-slate-500">
							Editable tests:{" "}
							<span className="font-semibold text-slate-900">
								{editableItems.length}
							</span>
						</p>

						<div className="flex flex-wrap items-center gap-2">
							<button
								type="button"
								onClick={onClose}
								disabled={saving}
								className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
							>
								Close
							</button>

							<button
								type="button"
								onClick={handleSaveCurrent}
								disabled={saving || !activeItem || activeReadOnly}
								className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
							>
								Save Current
							</button>

							<button
								type="button"
								onClick={handleSaveAndNext}
								disabled={saving || !activeItem || activeReadOnly}
								className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
							>
								Save & Next
							</button>

							<button
								type="button"
								onClick={handleSaveAll}
								disabled={saving || !hasEditableItems}
								className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{saving ? "Saving..." : "Save All Results"}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}