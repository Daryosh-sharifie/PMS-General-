import { formatAfghanDate } from "../../utils/afghanCalendar";

function normalizeTemplate(templateSnapshot) {
	if (!templateSnapshot) return [];

	if (Array.isArray(templateSnapshot)) return templateSnapshot;

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

function getFieldFromTemplate(item, key) {
	const template = normalizeTemplate(item?.templateSnapshot);
	return template.find((field) => field.key === key) || null;
}

function getPatientName(order) {
	return order?.patientName || order?.patient?.fullname || order?.patient?.name || "-";
}

function getPatientFatherName(order) {
	return (
		order?.patientFathername ||
		order?.patient?.fathername ||
		order?.patient?.fatherName ||
		"-"
	);
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

function getResultRows(order) {
	const rows = [];

	(order?.items || []).forEach((item) => {
		const manualResults = normalizeManualResults(item.manualResults);
		const template = normalizeTemplate(item.templateSnapshot);

		const keys =
			Object.keys(manualResults).length > 0
				? Object.keys(manualResults)
				: template.map((field) => field.key).filter(Boolean);

		if (!keys.length) {
			rows.push({
				testName: item.testNameSnapshot || "Lab Test",
				category: item.categorySnapshot || "General",
				parameter: "-",
				value: "",
				unit: "-",
				range: "-",
				remarks: item.remarks || "",
				isFirstRowOfTest: true,
			});
			return;
		}

		keys.forEach((key, index) => {
			const field = getFieldFromTemplate(item, key);
			const value = manualResults[key];

			rows.push({
				testName: index === 0 ? item.testNameSnapshot || "Lab Test" : "",
				category: index === 0 ? item.categorySnapshot || "General" : "",
				parameter: field?.label || key,
				value:
					value !== undefined && value !== null && value !== ""
						? String(value)
						: "",
				unit: field?.unit || "-",
				range: field?.normalRange || field?.referenceRange || "-",
				remarks: index === 0 ? item.remarks || "" : "",
				isFirstRowOfTest: index === 0,
			});
		});
	});

	return rows;
}

export default function LabReportPrintView({ order, mode = "print" }) {
	const rows = getResultRows(order);

	const wrapperClass = mode === "screen" ? "block" : "hidden print:block";

	return (
		<div className={wrapperClass}>
			<div className="mx-auto w-full max-w-[190mm] bg-white text-slate-950">
				<div className="mb-3 rounded-lg border border-slate-300 px-4 py-3">
					<div className="flex items-start justify-between gap-4">
						<div>
							<h1 className="text-[18px] font-bold leading-tight tracking-tight">
								Blood Test Lab Result Form
							</h1>
							<p className="mt-1 text-[10.5px] font-medium text-slate-500">
								Laboratory Result Report
							</p>
						</div>

						<div className="rounded-md bg-slate-50 px-3 py-2 text-right text-[10px] leading-relaxed">
							<p>
								<span className="font-bold text-slate-800">Lab No:</span>{" "}
								{order?.labOrderNo || "-"}
							</p>
							<p>
								<span className="font-bold text-slate-800">Prescription:</span>{" "}
								{getPrescriptionNo(order)}
							</p>
							<p>
								<span className="font-bold text-slate-800">Date:</span>{" "}
								{formatAfghanDate(order?.createdAt, { englishDigits: true })}
							</p>
						</div>
					</div>
				</div>

				<div className="mb-3 overflow-hidden rounded-lg border border-slate-300">
					<div className="bg-slate-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-700">
						Patient & Order Information
					</div>

					<div className="grid grid-cols-4 text-[10px] leading-relaxed">
						<div className="border-t border-r border-slate-200 px-2.5 py-1.5">
							<p className="text-[8.5px] font-bold uppercase text-slate-500">
								Patient
							</p>
							<p className="font-semibold text-slate-900">{getPatientName(order)}</p>
						</div>

						<div className="border-t border-r border-slate-200 px-2.5 py-1.5">
							<p className="text-[8.5px] font-bold uppercase text-slate-500">
								Father
							</p>
							<p className="font-semibold text-slate-900">
								{getPatientFatherName(order)}
							</p>
						</div>

						<div className="border-t border-r border-slate-200 px-2.5 py-1.5">
							<p className="text-[8.5px] font-bold uppercase text-slate-500">
								Age
							</p>
							<p className="font-semibold text-slate-900">{getPatientAge(order)}</p>
						</div>

						<div className="border-t border-slate-200 px-2.5 py-1.5">
							<p className="text-[8.5px] font-bold uppercase text-slate-500">
								Gender
							</p>
							<p className="font-semibold text-slate-900">
								{getPatientGender(order)}
							</p>
						</div>

						<div className="col-span-2 border-t border-r border-slate-200 px-2.5 py-1.5">
							<p className="text-[8.5px] font-bold uppercase text-slate-500">
								Doctor
							</p>
							<p className="font-semibold text-slate-900">{getDoctorName(order)}</p>
						</div>

						<div className="border-t border-r border-slate-200 px-2.5 py-1.5">
							<p className="text-[8.5px] font-bold uppercase text-slate-500">
								Status
							</p>
							<p className="font-semibold text-slate-900">{order?.status || "-"}</p>
						</div>

						<div className="border-t border-slate-200 px-2.5 py-1.5">
							<p className="text-[8.5px] font-bold uppercase text-slate-500">
								Tests
							</p>
							<p className="font-semibold text-slate-900">
								{order?.items?.length || 0}
							</p>
						</div>
					</div>
				</div>

				<div className="overflow-hidden rounded-lg border border-slate-300">
					<div className="bg-slate-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-700">
						Test Results
					</div>

					<table className="w-full border-collapse text-[9.5px] leading-snug">
						<thead>
							<tr className="bg-white text-slate-600">
								<th className="w-[15%] border-t border-r border-slate-200 px-2 py-1.5 text-left font-bold">
									Test
								</th>
								<th className="w-[13%] border-t border-r border-slate-200 px-2 py-1.5 text-left font-bold">
									Category
								</th>
								<th className="w-[22%] border-t border-r border-slate-200 px-2 py-1.5 text-left font-bold">
									Parameter
								</th>
								<th className="w-[15%] border-t border-r border-slate-200 px-2 py-1.5 text-left font-bold">
									Result
								</th>
								<th className="w-[10%] border-t border-r border-slate-200 px-2 py-1.5 text-left font-bold">
									Unit
								</th>
								<th className="w-[13%] border-t border-r border-slate-200 px-2 py-1.5 text-left font-bold">
									Range
								</th>
								<th className="w-[12%] border-t border-slate-200 px-2 py-1.5 text-left font-bold">
									Remarks
								</th>
							</tr>
						</thead>

						<tbody>
							{rows.length > 0 ? (
								rows.map((row, index) => (
									<tr
										key={`${row.testName}-${row.parameter}-${index}`}
										className={row.isFirstRowOfTest ? "bg-slate-50/60" : "bg-white"}
									>
										<td className="border-t border-r border-slate-200 px-2 py-1.5 align-top font-bold text-slate-900">
											{row.testName}
										</td>

										<td className="border-t border-r border-slate-200 px-2 py-1.5 align-top text-slate-700">
											{row.category}
										</td>

										<td className="border-t border-r border-slate-200 px-2 py-1.5 align-top font-semibold text-slate-800">
											{row.parameter}
										</td>

										<td className="border-t border-r border-slate-200 px-2 py-1.5 align-top font-semibold text-slate-950">
											{row.value}
										</td>

										<td className="border-t border-r border-slate-200 px-2 py-1.5 align-top text-slate-700">
											{row.unit}
										</td>

										<td className="border-t border-r border-slate-200 px-2 py-1.5 align-top text-slate-700">
											{row.range}
										</td>

										<td className="border-t border-slate-200 px-2 py-1.5 align-top text-slate-700">
											{row.remarks}
										</td>
									</tr>
								))
							) : (
								<tr>
									<td
										colSpan={7}
										className="border-t border-slate-200 px-3 py-4 text-center text-slate-500"
									>
										No result values entered.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>

				<div className="mt-5 grid grid-cols-3 gap-8 text-[10px] text-slate-700">
					<div className="border-t border-slate-400 pt-1.5">
						Lab Staff Signature
					</div>
					<div className="border-t border-slate-400 pt-1.5 text-center">
						Verified By
					</div>
					<div className="border-t border-slate-400 pt-1.5 text-right">
						Doctor Signature
					</div>
				</div>

				<style>{`
					@media print {
						@page {
							size: A4 portrait;
							margin: 7mm;
						}

						html,
						body,
						#root {
							height: auto !important;
							min-height: auto !important;
							overflow: visible !important;
						}

						body {
							background: white !important;
							-webkit-print-color-adjust: exact;
							print-color-adjust: exact;
						}

						* {
							overflow: visible !important;
						}
					}
				`}</style>
			</div>
		</div>
	);
}