import { formatAfghanDate } from "../../utils/afghanCalendar";
import { useLanguage } from "../../i18n/LanguageContext";

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

function getResultRows(order, defaultTestName, defaultCategory) {
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
				testName: item.testNameSnapshot || defaultTestName,
				category: item.categorySnapshot || defaultCategory,
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
				testName: index === 0 ? item.testNameSnapshot || defaultTestName : "",
				category: index === 0 ? item.categorySnapshot || defaultCategory : "",
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
	const { t, language } = useLanguage();
	const isRtl = language === "fa";

	const rows = getResultRows(order, t("labTest"), t("general"));

	const wrapperClass = mode === "screen" ? "block" : "hidden print:block";

	return (
		<div dir={isRtl ? "rtl" : "ltr"} className={wrapperClass}>
			<div className="mx-auto w-full max-w-[190mm] bg-white text-slate-950">
				<div className="mb-3 rounded-lg border border-slate-300 px-4 py-3">
					<div className="flex items-start justify-between gap-4">
						<div className={isRtl ? "text-right" : "text-left"}>
							<h1 className="text-[18px] font-bold leading-tight tracking-tight">
								{t("bloodTestLabResultForm")}
							</h1>
							<p className="mt-1 text-[10.5px] font-medium text-slate-500">
								{t("laboratoryResultReport")}
							</p>
						</div>

						<div className={`rounded-md bg-slate-50 px-3 py-2 text-[10px] leading-relaxed ${isRtl ? "text-left" : "text-right"}`}>
							<p>
								<span className="font-bold text-slate-800">{t("labNumber")}:</span>{" "}
								{order?.labOrderNo || "-"}
							</p>
							<p>
								<span className="font-bold text-slate-800">{t("prescription")}:</span>{" "}
								{getPrescriptionNo(order)}
							</p>
							<p>
								<span className="font-bold text-slate-800">{t("orderDate")}:</span>{" "}
								{formatAfghanDate(order?.createdAt, { englishDigits: !isRtl })}
							</p>
						</div>
					</div>
				</div>

				<div className="mb-3 overflow-hidden rounded-lg border border-slate-300">
					<div className="bg-slate-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-700">
						{t("patientOrderInformation")}
					</div>

					<div className="grid grid-cols-4 text-[10px] leading-relaxed">
						<div className={`border-t px-2.5 py-1.5 ${isRtl ? "border-l" : "border-r"} border-slate-200`}>
							<p className="text-[8.5px] font-bold uppercase text-slate-500">
								{t("patient")}
							</p>
							<p className="font-semibold text-slate-900">{getPatientName(order)}</p>
						</div>

						<div className={`border-t px-2.5 py-1.5 ${isRtl ? "border-l" : "border-r"} border-slate-200`}>
							<p className="text-[8.5px] font-bold uppercase text-slate-500">
								{t("father")}
							</p>
							<p className="font-semibold text-slate-900">
								{getPatientFatherName(order)}
							</p>
						</div>

						<div className={`border-t px-2.5 py-1.5 ${isRtl ? "border-l" : "border-r"} border-slate-200`}>
							<p className="text-[8.5px] font-bold uppercase text-slate-500">
								{t("age")}
							</p>
							<p className="font-semibold text-slate-900">{getPatientAge(order)}</p>
						</div>

						<div className="border-t border-slate-200 px-2.5 py-1.5">
							<p className="text-[8.5px] font-bold uppercase text-slate-500">
								{t("gender")}
							</p>
							<p className="font-semibold text-slate-900">
								{getPatientGender(order)}
							</p>
						</div>

						<div className={`col-span-2 border-t px-2.5 py-1.5 ${isRtl ? "border-l" : "border-r"} border-slate-200`}>
							<p className="text-[8.5px] font-bold uppercase text-slate-500">
								{t("doctor")}
							</p>
							<p className="font-semibold text-slate-900">{getDoctorName(order)}</p>
						</div>

						<div className={`border-t px-2.5 py-1.5 ${isRtl ? "border-l" : "border-r"} border-slate-200`}>
							<p className="text-[8.5px] font-bold uppercase text-slate-500">
								{t("status")}
							</p>
							<p className="font-semibold text-slate-900">{order?.status ? t(order.status.toLowerCase()) || order.status : "-"}</p>
						</div>

						<div className="border-t border-slate-200 px-2.5 py-1.5">
							<p className="text-[8.5px] font-bold uppercase text-slate-500">
								{t("tests")}
							</p>
							<p className="font-semibold text-slate-900">
								{order?.items?.length || 0}
							</p>
						</div>
					</div>
				</div>

				<div className="overflow-hidden rounded-lg border border-slate-300">
					<div className="bg-slate-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-700">
						{t("testResults")}
					</div>

					<table className="w-full border-collapse text-[9.5px] leading-snug">
						<thead>
							<tr className="bg-white text-slate-600">
								<th className={`w-[15%] border-t px-2 py-1.5 font-bold ${isRtl ? "border-l text-right" : "border-r text-left"}`}>
									{t("testName")}
								</th>
								<th className={`w-[13%] border-t px-2 py-1.5 font-bold ${isRtl ? "border-l text-right" : "border-r text-left"}`}>
									{t("category")}
								</th>
								<th className={`w-[22%] border-t px-2 py-1.5 font-bold ${isRtl ? "border-l text-right" : "border-r text-left"}`}>
									{t("parameter")}
								</th>
								<th className={`w-[15%] border-t px-2 py-1.5 font-bold ${isRtl ? "border-l text-right" : "border-r text-left"}`}>
									{t("result")}
								</th>
								<th className={`w-[10%] border-t px-2 py-1.5 font-bold ${isRtl ? "border-l text-right" : "border-r text-left"}`}>
									{t("unit")}
								</th>
								<th className={`w-[13%] border-t px-2 py-1.5 font-bold ${isRtl ? "border-l text-right" : "border-r text-left"}`}>
									{t("range")}
								</th>
								<th className={`w-[12%] border-t border-slate-200 px-2 py-1.5 font-bold ${isRtl ? "text-right" : "text-left"}`}>
									{t("remarks")}
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
										<td className={`border-t px-2 py-1.5 align-top font-bold text-slate-900 ${isRtl ? "border-l" : "border-r"} border-slate-200`}>
											{row.testName}
										</td>

										<td className={`border-t px-2 py-1.5 align-top text-slate-700 ${isRtl ? "border-l" : "border-r"} border-slate-200`}>
											{row.category}
										</td>

										<td className={`border-t px-2 py-1.5 align-top font-semibold text-slate-800 ${isRtl ? "border-l" : "border-r"} border-slate-200`}>
											{row.parameter}
										</td>

										<td className={`border-t px-2 py-1.5 align-top font-semibold text-slate-950 ${isRtl ? "border-l" : "border-r"} border-slate-200`}>
											{row.value}
										</td>

										<td className={`border-t px-2 py-1.5 align-top text-slate-700 ${isRtl ? "border-l" : "border-r"} border-slate-200`}>
											{row.unit}
										</td>

										<td className={`border-t px-2 py-1.5 align-top text-slate-700 ${isRtl ? "border-l" : "border-r"} border-slate-200`}>
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
										{t("noResultValues")}
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>

				<div className="mt-5 grid grid-cols-3 gap-8 text-[10px] text-slate-700">
					<div className={`border-t border-slate-400 pt-1.5 ${isRtl ? "text-right" : "text-left"}`}>
						{t("labStaffSignature")}
					</div>
					<div className="border-t border-slate-400 pt-1.5 text-center">
						{t("verifiedBy")}
					</div>
					<div className={`border-t border-slate-400 pt-1.5 ${isRtl ? "text-left" : "text-right"}`}>
						{t("doctorSignature")}
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