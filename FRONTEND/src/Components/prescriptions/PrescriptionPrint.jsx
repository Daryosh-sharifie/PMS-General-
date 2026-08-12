import { formatAfghanDate } from "../../utils/afghanCalendar";

const escapeHtml = (value = "") =>
	String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");

const formatTextTwoLines = (value, { splitAt = 8 } = {}) => {
	const text = String(value ?? "").trim();
	if (!text || text === "-") return escapeHtml(text || "-");

	const words = text.split(/\s+/).filter(Boolean);

	if (words.length >= 2) {
		let splitIndex = 1;
		let bestDiff = Infinity;

		for (let index = 1; index < words.length; index += 1) {
			const firstLine = words.slice(0, index).join(" ");
			const secondLine = words.slice(index).join(" ");
			const diff = Math.abs(firstLine.length - secondLine.length);

			if (diff < bestDiff) {
				bestDiff = diff;
				splitIndex = index;
			}
		}

		const line1 = words.slice(0, splitIndex).join(" ");
		const line2 = words.slice(splitIndex).join(" ");
		return `${escapeHtml(line1)}<br />${escapeHtml(line2)}`;
	}

	if (text.length <= splitAt) {
		return escapeHtml(text);
	}

	const mid = Math.ceil(text.length / 2);
	return `${escapeHtml(text.slice(0, mid))}<br />${escapeHtml(text.slice(mid))}`;
};

const pick = (...values) =>
	values.find(
		(value) =>
			value !== undefined && value !== null && String(value).trim() !== ""
	) || "";

const pickBySubstring = (obj, substrings) => {
	if (!obj) return "";

	for (const key of Object.keys(obj)) {
		const lower = key.toLowerCase();

		if (substrings.some((substring) => lower.includes(substring))) {
			const value = obj[key];

			if (
				value !== undefined &&
				value !== null &&
				String(value).trim() !== ""
			) {
				return value;
			}
		}
	}

	return "";
};

const getJalaliDate = (date) => formatAfghanDate(date, { englishDigits: true });

const getGender = (rawGender) => {
	const gender = String(rawGender || "").trim();

	if (!gender) return "";

	const lower = gender.toLowerCase();

	if (lower === "male" || gender === "مرد" || gender === "ذکور") return "Male";
	if (lower === "female" || gender === "زن" || gender === "اناث") return "Female";

	return gender;
};

const normalizeMedicines = (medicines = []) =>
	(Array.isArray(medicines) ? medicines : [])
		.filter((medicine) => medicine && typeof medicine === "object")
		.map((medicine) => ({
			name: pick(
				medicine.name,
				medicine.medicineName,
				medicine.genericName,
				pickBySubstring(medicine, ["name", "drug"])
			),
			dosage: pick(
				medicine.dosage,
				medicine.dose,
				medicine.dos,
				medicine.dosageText,
				pickBySubstring(medicine, ["dos", "dose", "strength"])
			),
			frequency: pick(
				medicine.frequency,
				medicine.freq,
				medicine.frequencyPerDay,
				medicine.frequencyText,
				pickBySubstring(medicine, ["freq"])
			),
			duration: pick(medicine.duration),
			amount: pick(
				medicine.amount,
				medicine.quantity,
				medicine.qty,
				pickBySubstring(medicine, ["amount", "qty", "quantity"])
			),
			mealTiming: pick(
				medicine.mealTiming,
				pickBySubstring(medicine, ["meal", "food"])
			),
			instructions: pick(medicine.instructions),
			route: pick(
				medicine.route,
				medicine.method,
				medicine.routeName,
				pickBySubstring(medicine, ["route", "method"])
			),
			type: pick(
				medicine.type,
				medicine.form,
				medicine.drugType,
				medicine.medicineType,
				medicine.typeName,
				pickBySubstring(medicine, ["type", "form"])
			),
		}));

const getLabTestsForPrint = (labTests = [], prescriptionData) => {
	const source = labTests.length
		? labTests
		: extractLabTestsFromPrescription(prescriptionData);

	const items = (Array.isArray(source) ? source : [])
		.map((test) => ({
			name: pick(
				test?.name,
				test?.labTest?.name,
				test?.testName,
				test?.testNameSnapshot
			),
			category: pick(
				test?.category,
				test?.categorySnapshot,
				test?.labTest?.category
			),
		}))
		.filter((test) => test.name);

	const unique = [];
	const seen = new Set();

	for (const item of items) {
		const key = item.name.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		unique.push(item);
	}

	return unique;
};

const buildLabExaminationHtml = (labTestItems = []) => {
	if (!labTestItems.length) {
		return `<div class="clinical-line-value">-</div>`;
	}

	return `
		<ul class="lab-examination-list">
			${labTestItems
			.map(
				(test) => `
				<li class="lab-examination-item">
					<span class="lab-examination-name">${escapeHtml(test.name)}</span>
					${test.category
						? `<span class="lab-examination-category">${escapeHtml(test.category)}</span>`
						: ""
					}
				</li>
			`
			)
			.join("")}
		</ul>
	`;
};

const extractLabTestsFromPrescription = (prescriptionData) => {
	const orders = prescriptionData?.labOrders || [];
	const tests = [];

	for (const order of orders) {
		for (const item of order?.items || []) {
			if (item?.labTest) {
				tests.push(item.labTest);
			}
		}
	}

	return tests;
};

const buildMedicineLines = (medicines) => {
	const normalized = normalizeMedicines(
		(Array.isArray(medicines) ? medicines : []).slice(0, 10)
	);

	if (!normalized.length) return "";

	let rowNumber = 0;

	const rows = normalized
		.map((medicine) => {
			const hasContent = [
				medicine.name,
				medicine.dosage,
				medicine.frequency,
				medicine.amount,
				medicine.mealTiming,
				medicine.type,
			].some(Boolean);

			if (!hasContent) return "";

			rowNumber += 1;

			return `
				<tr>
					<td class="col-no">${rowNumber}</td>
					<td class="col-type"><div class="cell-text" dir="ltr">${escapeHtml(medicine.type || "-")}</div></td>
					<td class="col-name"><div class="cell-text cell-name" dir="ltr">${escapeHtml(medicine.name || "-")}</div></td>
					<td class="col-qty"><div class="cell-clamp" dir="ltr">${escapeHtml(medicine.amount || "-")}</div></td>
					<td class="col-dose"><div class="cell-clamp" dir="ltr">${escapeHtml(medicine.dosage || "-")}</div></td>
					<td class="col-freq"><div class="cell-clamp" dir="ltr">${escapeHtml(medicine.frequency || "-")}</div></td>
					<td class="col-meal"><div class="cell-clamp" dir="ltr">${escapeHtml(medicine.mealTiming || "-")}</div></td>
				</tr>
			`;
		})
		.join("");

	return `
		<table class="medicine-table">
			<tbody>${rows}</tbody>
		</table>
	`;
};

export const printPrescription = ({
	prescriptionData,
	patientData,
	currentUser,
	medicines = [],
	labTests = [],
	pageSize = "A4",
	orientation = "portrait",
	margin = "0mm",
	fontBoost = 0,
}) => {
	const boost = Math.min(5, Math.max(0, Number(fontBoost) || 0));
	const panelTop = boost >= 5 ? "78mm" : boost > 0 ? `${85 - Math.min(boost * 1.2, 6)}mm` : "85mm";
	const panelBottom = boost >= 5 ? "20mm" : boost > 0 ? `${34 - Math.min(boost * 1.6, 8)}mm` : "34mm";
	const cellPaddingY = boost >= 5 ? "0.9mm" : boost > 0 ? "1mm" : "1.2mm";
	const cellPaddingX = boost >= 5 ? "0.55mm" : "0.7mm";
	const footerBoxHeight = boost >= 4 ? "12mm" : "16mm";
	const noColWidth = "4%";
	const typeColWidth = boost >= 4 ? "22%" : "20%";
	const nameColWidth = boost >= 4 ? "30%" : "34%";
	const qtyColWidth = "5%";
	const doseColWidth = "11%";
	const freqColWidth = "12%";
	const mealColWidth = boost >= 4 ? "16%" : "14%";
	const printFrame = document.createElement("iframe");

	printFrame.style.position = "fixed";
	printFrame.style.right = "0";
	printFrame.style.bottom = "0";
	printFrame.style.width = "0";
	printFrame.style.height = "0";
	printFrame.style.border = "none";

	document.body.appendChild(printFrame);

	const doc = printFrame.contentDocument || printFrame.contentWindow.document;

	const selectedPageSize = pageSize || "A4";
	const selectedOrientation = orientation || "portrait";
	const pageMargin = margin || "0mm";
	const pageCssSize = `${selectedPageSize}${selectedOrientation ? ` ${selectedOrientation}` : ""}`;

	const prescriptionNo = pick(
		prescriptionData?.prescriptionNo,
		prescriptionData?.prescriptionNumber,
		prescriptionData?.id
	);

	const patientName = pick(
		prescriptionData?.patientName,
		patientData?.fullname,
		patientData?.name,
		prescriptionData?.patient?.fullname,
		prescriptionData?.patient?.name
	);

	const fatherName = pick(
		prescriptionData?.patientFathername,
		prescriptionData?.fathername,
		prescriptionData?.fatherName,
		prescriptionData?.father_name,
		prescriptionData?.patient?.fathername,
		prescriptionData?.patient?.fatherName,
		prescriptionData?.patient?.father_name,
		patientData?.fathername,
		patientData?.fatherName,
		patientData?.father_name
	);

	const gender = getGender(
		pick(
			prescriptionData?.patientGender,
			prescriptionData?.gender,
			prescriptionData?.patient?.gender,
			patientData?.gender
		)
	);

	const age = pick(
		prescriptionData?.patientAge,
		prescriptionData?.age,
		prescriptionData?.patient?.age,
		patientData?.age
	);

	const prescriptionDate = getJalaliDate(
		prescriptionData?.date || prescriptionData?.createdAt
	);

	const doctorName = pick(
		prescriptionData?.doctorName,
		prescriptionData?.doctor?.name,
		currentUser?.name
	);

	const clinical = {
		bloodPressure: pick(prescriptionData?.bloodPressure),
		pulseRate: pick(prescriptionData?.pulseRate),
		temperature: pick(prescriptionData?.temperature),
		spo2: pick(prescriptionData?.spo2),
		clc: pick(
			prescriptionData?.clc,
			prescriptionData?.diagnosis,
			prescriptionData?.notes
		),
		pastHistory: pick(prescriptionData?.pastHistory),
		investigation: pick(prescriptionData?.investigation),
		impression: pick(prescriptionData?.impression),
		instructions: pick(prescriptionData?.instructions),
	};

	const labTestItems = getLabTestsForPrint(labTests, prescriptionData);
	const labExaminationHtml = buildLabExaminationHtml(labTestItems);

	const medicineLines = buildMedicineLines(medicines);

	doc.open();
	doc.write(`
		<!DOCTYPE html>
		<html dir="ltr">
		<head>
			<meta charset="utf-8" />
			<title>Prescription - ${escapeHtml(prescriptionNo || "RX")}</title>

			<style>
				@page {
					size: ${pageCssSize};
					margin: ${pageMargin};
				}

				* {
					box-sizing: border-box;
					margin: 0;
					padding: 0;
				}

				html,
				body {
					width: 210mm;
					height: 297mm;
					margin: 0;
					padding: 0;
					overflow: hidden;
					background: white;
					color: #2b2b2b;
					font-family: Arial, Helvetica, sans-serif;
					direction: ltr;
					-webkit-print-color-adjust: exact;
					print-color-adjust: exact;
				}

				.prescription-page {
					position: relative;
					width: 210mm;
					height: 297mm;
					overflow: hidden;
					background: white;
				}

				.prescription-number {
					position: absolute;
					top: 46mm;
					right: 13mm;
					width: 80mm;
					text-align: right;
					direction: rtl;
					unicode-bidi: isolate;
					font-size: 14px;
					font-weight: 800;
					letter-spacing: 0.2px;
				}

				.patient-row {
					position: absolute;
					top: 58mm;
					left: 10mm;
					right: 12mm;
					height: 18mm;
					display: grid;
					grid-template-columns: 1.55fr 1.55fr 0.72fr 0.72fr 1.55fr;
					gap: 3mm;
					align-items: end;
				}

				.field {
					min-width: 0;
				}

				.field-label {
					display: block;
					font-size: 8px;
					font-weight: 800;
					color: #555;
					text-transform: uppercase;
					letter-spacing: 0.4px;
					margin: 0 0 2mm 0.6mm;
				}

				.field-box {
					height: 10mm;
					border: 1.6px solid #222;
					border-radius: 1.5mm;
					display: flex;
					align-items: center;
					justify-content: center;
					padding: 0 3mm;
					font-size: 13px;
					font-weight: 700;
					line-height: 1.1;
					overflow: hidden;
					white-space: nowrap;
					text-overflow: ellipsis;
				}

				

				.clinical-title {
					font-size: 16px;
					font-weight: 900;
					line-height: 1;
					margin-bottom: 2.5mm;
				}

				.title-line {
					width: 100%;
					border-bottom: 1.5px solid #111;
					margin-bottom: 4mm;
				}

				.vitals-grid {
					display: grid;
					grid-template-columns: 1fr 1fr;
					column-gap: 4mm;
					row-gap: 2.5mm;
					margin-bottom: 3mm;
					padding-left: 0.3mm;
					flex-shrink: 0;
				}

				.vital-item {
					font-size: 9px;
					font-weight: 900;
					color: #444;
					white-space: nowrap;
				}

				.clinical-line {
					flex: 1;
					min-height: 0;
					margin-bottom: 0;
					display: flex;
					flex-direction: column;
				}

				.clinical-line.lab-examination {
					flex: 1.15;
				}

				.clinical-line-label {
					font-size: 9px;
					font-weight: 900;
					color: #444;
					text-transform: uppercase;
					margin-bottom: 1.5mm;
				}

				.clinical-line-rule {
					border-bottom: 1.35px solid #111;
					margin-bottom: 1.5mm;
				}

				.clinical-line-value {
					flex: 1;
					min-height: 3mm;
					font-size: 10px;
					font-weight: 600;
					line-height: 1.35;
					white-space: pre-wrap;
					overflow: hidden;
				}

				.lab-examination-list {
					list-style: none;
					margin: 0;
					padding: 0;
					flex: 1;
					min-height: 0;
					display: flex;
					flex-direction: column;
					gap: 1mm;
					overflow: hidden;
				}

				.lab-examination-item {
					display: flex;
					flex-direction: column;
					gap: 0.4mm;
					padding: 0;
				}

				.lab-examination-name {
					font-size: 10px;
					font-weight: 700;
					line-height: 1.3;
					color: #222;
					word-break: break-word;
				}

				.lab-examination-category {
					font-size: 8px;
					font-weight: 600;
					line-height: 1.25;
					color: #666;
					text-transform: uppercase;
					letter-spacing: 0.2px;
				}

				:root {
					--print-panel-top: ${panelTop};
					--print-panel-bottom: ${panelBottom};
				}

				.clinical-panel {
					position: absolute;
					top: var(--print-panel-top);
					bottom: var(--print-panel-bottom);
					left: 10mm;
					width: 43mm;
					border-right: 1.5px solid #111;
					padding-right: 2mm;
					overflow: hidden;
					display: flex;
					flex-direction: column;
				}

				.clinical-header {
					flex-shrink: 0;
				}

				.clinical-body {
					flex: 1;
					min-height: 0;
					display: flex;
					flex-direction: column;
					gap: 2.5mm;
				}

				.rx-panel {
					position: absolute;
					top: var(--print-panel-top);
					bottom: var(--print-panel-bottom);
					left: 58mm;
					right: 8mm;
					border: 2px solid #111;
					border-radius: 1.6mm;
					overflow: hidden;
					display: flex;
					flex-direction: column;
					padding: 2.5mm 2mm 3mm;
					gap: 1.2mm;
				}

				.rx-title {
					flex-shrink: 0;
					font-size: 19px;
					font-weight: 900;
					line-height: 1;
				}

				.rx-content {
					flex: 0 1 auto;
					overflow: visible;
					font-size: 12px;
					line-height: 1.7;
					padding: 0;
					margin: 0;
				}

				.medicine-table {
					width: 100%;
					height: auto;
					table-layout: fixed;
					border-collapse: separate;
					border-spacing: 0 0.7mm;
					font-size: ${11 + boost}px;
					direction: ltr;
				}

				.medicine-table th,
				.medicine-table td {
					padding: ${cellPaddingY} ${cellPaddingX};
					text-align: left;
					vertical-align: middle;
					white-space: normal;
					direction: ltr;
					unicode-bidi: embed;
					box-sizing: border-box;
				}

				.medicine-table .cell-text {
					display: block;
					overflow: hidden;
					white-space: normal;
					word-break: normal;
					overflow-wrap: break-word;
					line-height: 1.25;
					width: 100%;
					direction: ltr;
					text-align: left;
					unicode-bidi: embed;
				}

				.medicine-table .cell-name {
					font-weight: 700;
					color: #111;
				}

				.medicine-table .cell-clamp {
					display: -webkit-box;
					-webkit-line-clamp: 2;
					-webkit-box-orient: vertical;
					overflow: hidden;
					white-space: normal;
					word-break: normal;
					overflow-wrap: break-word;
					line-height: 1.25;
					direction: ltr;
					text-align: left;
					unicode-bidi: embed;
				}

				.medicine-table tbody td {
					font-weight: 400;
					border-bottom: 0.3mm solid #e8e8e8;
					overflow: hidden;
				}

				.medicine-table tbody tr:last-child td {
					border-bottom: none;
				}

				.medicine-table .col-no {
					width: ${noColWidth};
					padding-left: 0.3mm;
					padding-right: 0.5mm;
					text-align: center;
					font-weight: 800;
				}

				.medicine-table .col-type {
					width: ${typeColWidth};
					padding-left: 0.3mm;
					padding-right: 0.8mm;
					font-weight: 800;
					white-space: nowrap;
					letter-spacing: -0.25px;
				}

				.medicine-table .col-type .cell-text {
					white-space: nowrap;
					letter-spacing: -0.25px;
				}

				.medicine-table .col-name {
					width: ${nameColWidth};
					padding-left: 1.4mm;
					padding-right: 0.4mm;
				}

				.medicine-table .col-qty {
					width: ${qtyColWidth};
					padding-left: 0.2mm;
					padding-right: 0.4mm;
					text-align: center;
				}

				.medicine-table .col-dose {
					width: ${doseColWidth};
					padding-left: 0.6mm;
					padding-right: 0.6mm;
				}

				.medicine-table .col-freq {
					width: ${freqColWidth};
					padding-left: 0.6mm;
					padding-right: 0.6mm;
				}

				.medicine-table .col-meal {
					width: ${mealColWidth};
					padding-left: 0.6mm;
					padding-right: 0.3mm;
				}

				.medicine-table .col-qty .cell-clamp,
				.medicine-table .col-qty .cell-text {
					text-align: center;
				}

				.rx-footer {
					flex-shrink: 0;
					display: flex;
					align-items: flex-end;
					gap: 3mm;
					margin-top: auto;
				}

				.instructions-section {
					flex: 1;
					min-width: 0;
				}

				.instructions-label {
					font-size: 8px;
					font-weight: 900;
					color: #444;
					text-transform: uppercase;
					margin-bottom: 2mm;
					letter-spacing: 0.3px;
				}

				.instructions-box {
					height: ${footerBoxHeight};
					border: 1px solid #d5d5d5;
					border-radius: 1.4mm;
					background: #fbfbfb;
					padding: 2mm;
					font-size: 10px;
					line-height: 1.35;
					white-space: pre-wrap;
					overflow: hidden;
				}

				.signature-section {
					width: 44mm;
					flex-shrink: 0;
				}

				.signature-box {
					height: ${footerBoxHeight};
					border: 1px solid #d5d5d5;
					border-radius: 1.4mm;
					background: #fbfbfb;
					padding: 2mm 2.5mm;
					display: flex;
					flex-direction: column;
					justify-content: space-between;
					align-items: stretch;
				}

				.signature-name {
					font-size: 10px;
					font-weight: 800;
					text-align: left;
					align-self: flex-start;
					color: #2b2b2b;
				}

				.signature-line {
					display: block;
					width: 100%;
					border-bottom: 1.3px solid #111;
					margin-top: auto;
				}

				@media print {
					html,
					body {
						width: 210mm;
						height: 297mm;
						overflow: hidden;
					}

					.prescription-page {
						width: 210mm;
						height: 297mm;
						overflow: hidden;
						page-break-after: avoid;
						page-break-before: avoid;
						page-break-inside: avoid;
						break-after: avoid;
						break-before: avoid;
						break-inside: avoid;
					}
				}
			</style>
		</head>

		<body>
			<div class="prescription-page">
				<div class="prescription-number">
					شماره نسخه: <span dir="ltr">${escapeHtml(prescriptionNo || "-")}</span>
				</div>

				<section class="patient-row">
					<div class="field">
						<label class="field-label">NAME</label>
						<div class="field-box">${escapeHtml(patientName || "-")}</div>
					</div>

					<div class="field">
						<label class="field-label">F/NAME</label>
						<div class="field-box">${escapeHtml(fatherName || "-")}</div>
					</div>

					<div class="field">
						<label class="field-label">SEX</label>
						<div class="field-box">${escapeHtml(gender || "-")}</div>
					</div>

					<div class="field">
						<label class="field-label">AGE</label>
						<div class="field-box">${escapeHtml(age || "-")}</div>
					</div>

					<div class="field">
						<label class="field-label">DATE</label>
						<div class="field-box">${escapeHtml(prescriptionDate || "-")}</div>
					</div>
				</section>

				<aside class="clinical-panel">
					<div class="clinical-header">
						<h2 class="clinical-title">Clinical Records</h2>
						<div class="title-line"></div>
					</div>

					<div class="clinical-body">
						<div class="vitals-grid">
							<div class="vital-item">BP: ${escapeHtml(clinical.bloodPressure)}</div>
							<div class="vital-item">PR: ${escapeHtml(clinical.pulseRate)}</div>
							<div class="vital-item">Temp: ${escapeHtml(clinical.temperature)}</div>
							<div class="vital-item">SPO2: ${escapeHtml(clinical.spo2)}</div>
						</div>

						<div class="clinical-line cc">
							<div class="clinical-line-label">C/C</div>
							<div class="clinical-line-rule"></div>
							<div class="clinical-line-value">${escapeHtml(clinical.clc || "-")}</div>
						</div>

						<div class="clinical-line ph">
							<div class="clinical-line-label">P.H</div>
							<div class="clinical-line-rule"></div>
							<div class="clinical-line-value">${escapeHtml(clinical.pastHistory || "-")}</div>
						</div>

						<div class="clinical-line investigation">
							<div class="clinical-line-label">INVESTIGATION</div>
							<div class="clinical-line-rule"></div>
							<div class="clinical-line-value">${escapeHtml(clinical.investigation || "-")}</div>
						</div>

						<div class="clinical-line">
							<div class="clinical-line-label">IMPRESSION</div>
							<div class="clinical-line-rule"></div>
							<div class="clinical-line-value">${escapeHtml(clinical.impression || "-")}</div>
						</div>

						<div class="clinical-line lab-examination">
							<div class="clinical-line-label">LAB EXAMINATION</div>
							<div class="clinical-line-rule"></div>
							${labExaminationHtml}
						</div>
					</div>
				</aside>

				<section class="rx-panel">
					<div class="rx-title">RX:</div>

					<div class="rx-content">
						${medicineLines}
					</div>

					<div class="rx-footer">
						<div class="instructions-section">
							<div class="instructions-label">INSTRUCTIONS</div>
							<div class="instructions-box">${escapeHtml(clinical.instructions)}</div>
						</div>

						<div class="signature-section">
							<div class="signature-box">
								<div class="signature-name">Dr. ${escapeHtml(doctorName || "Admin")}</div>
								<div class="signature-line"></div>
							</div>
						</div>
					</div>
				</section>
			</div>
		</body>
		</html>
	`);
	doc.close();

	const doPrint = () => {
		try {
			printFrame.contentWindow.focus();
			printFrame.contentWindow.print();
		} finally {
			setTimeout(() => {
				if (document.body.contains(printFrame)) {
					document.body.removeChild(printFrame);
				}
			}, 300);
		}
	};

	setTimeout(doPrint, 180);
};