import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

const toEnglishDigits = (value = "") =>
	String(value).replace(/[۰-۹]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹".indexOf(digit));

const escapeHtml = (value = "") =>
	String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");

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

const getJalaliDate = (date) => {
	try {
		const jalali = new DateObject({
			date: date || new Date().toISOString(),
			calendar: persian,
			locale: persian_fa,
			format: "YYYY/MM/DD",
		});

		return toEnglishDigits(jalali.format("YYYY/MM/DD"));
	} catch {
		return "";
	}
};

const getGender = (rawGender) => {
	const gender = String(rawGender || "").trim();

	if (!gender) return "";

	const lower = gender.toLowerCase();

	if (lower === "male" || gender === "مرد" || gender === "ذکر") return "Male";
	if (lower === "female" || gender === "زن" || gender === "انثی") return "Female";

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

const buildInvestigationText = (investigation, labTests = []) => {
	const notes = pick(investigation);
	const testNames = (Array.isArray(labTests) ? labTests : [])
		.map((test) => pick(test?.name, test?.labTest?.name))
		.filter(Boolean);

	const uniqueNames = [...new Set(testNames)];

	if (notes && uniqueNames.length) {
		return `${notes}\n${uniqueNames.join(", ")}`;
	}

	return notes || uniqueNames.join(", ");
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
	const normalized = normalizeMedicines(medicines);

	if (!normalized.length) return "";

	return normalized
		.map((medicine, index) => {
			const parts = [
				medicine.name,
				medicine.dosage,
				medicine.frequency,
				medicine.duration,
				medicine.amount ? `Qty: ${medicine.amount}` : "",
				medicine.mealTiming,
				medicine.instructions,
			].filter(Boolean);

			if (!parts.length) return "";

			return `
				<div class="medicine-line">
					<span class="medicine-index">${index + 1}.</span>
					<span>${escapeHtml(parts.join(" - "))}</span>
				</div>
			`;
		})
		.join("");
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
}) => {
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
		investigation: buildInvestigationText(
			prescriptionData?.investigation,
			labTests.length ? labTests : extractLabTestsFromPrescription(prescriptionData)
		),
		impression: pick(prescriptionData?.impression),
		instructions: pick(prescriptionData?.instructions),
	};

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
					top: 39mm;
					right: 13mm;
					width: 80mm;
					text-align: right;
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
					font-size: 15px;
					font-weight: 900;
					line-height: 1;
					margin-bottom: 2.5mm;
				}

				.title-line {
					width: 41mm;
					border-bottom: 1.5px solid #111;
					margin-bottom: 12mm;
				}

				.vitals-grid {
					display: grid;
					grid-template-columns: 1fr 1fr;
					column-gap: 8mm;
					row-gap: 7mm;
					margin-bottom: 14mm;
					padding-left: 0.3mm;
				}

				.vital-item {
					font-size: 7.7px;
					font-weight: 900;
					color: #444;
					white-space: nowrap;
				}

				.clinical-line {
					margin-bottom: 7mm;
				}

				.clinical-line-label {
					font-size: 8px;
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
					min-height: 4mm;
					font-size: 8.5px;
					font-weight: 600;
					line-height: 1.3;
					white-space: pre-wrap;
					overflow: hidden;
				}

				:root {
					--print-panel-top: 82mm;
					--print-panel-bottom: 34mm;
				}

				.clinical-panel {
					position: absolute;
					top: var(--print-panel-top);
					bottom: var(--print-panel-bottom);
					left: 10mm;
					width: 43mm;
					height: auto;
					border-right: 1.5px solid #111;
					padding-right: 2mm;
					overflow: hidden;
				}

				.rx-panel {
					position: absolute;
					top: var(--print-panel-top);
					bottom: var(--print-panel-bottom);
					left: 58mm;
					right: 12mm;
					height: auto;
					border: 2px solid #111;
					border-radius: 1.6mm;
					overflow: hidden;
				}

				.rx-title {
					position: absolute;
					top: 6mm;
					left: 4mm;
					font-size: 19px;
					font-weight: 900;
				}

				.rx-content {
					position: absolute;
					top: 16mm;
					left: 5mm;
					right: 5mm;
					height: 121mm;
					overflow: hidden;
					font-size: 12px;
					line-height: 1.7;
				}

				.medicine-line {
					display: flex;
					gap: 2mm;
					margin-bottom: 2mm;
					font-weight: 600;
				}

				.medicine-index {
					width: 6mm;
					flex-shrink: 0;
					font-weight: 800;
				}

				.signature {
					position: absolute;
					right: 16mm;
					bottom: 40mm;
					font-size: 11px;
					font-weight: 800;
					white-space: nowrap;
				}

				.signature-line {
					display: inline-block;
					width: 34mm;
					border-bottom: 1.3px solid #111;
					margin-left: 3mm;
					transform: translateY(-1.5mm);
				}

				.instructions-section {
					position: absolute;
					left: 4mm;
					right: 4mm;
					bottom: 4mm;
				}

				.instructions-label {
					font-size: 8px;
					font-weight: 900;
					color: #444;
					text-transform: uppercase;
					margin-bottom: 2mm;
				}

				.instructions-box {
					height: 16mm;
					border: 1px solid #d5d5d5;
					border-radius: 1.4mm;
					background: #fbfbfb;
					padding: 3mm;
					font-size: 10px;
					line-height: 1.45;
					white-space: pre-wrap;
					overflow: hidden;
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
					شماره نسخه: ${escapeHtml(prescriptionNo || "-")}
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
					<h2 class="clinical-title">Clinical Records</h2>
					<div class="title-line"></div>

					<div class="vitals-grid">
						<div class="vital-item">BP: ${escapeHtml(clinical.bloodPressure)}</div>
						<div class="vital-item">PR: ${escapeHtml(clinical.pulseRate)}</div>
						<div class="vital-item">Temp: ${escapeHtml(clinical.temperature)}</div>
						<div class="vital-item">SPO2: ${escapeHtml(clinical.spo2)}</div>
					</div>

					<div class="clinical-line cc">
						<div class="clinical-line-label">C/C</div>
						<div class="clinical-line-rule"></div>
						<div class="clinical-line-value">${escapeHtml(clinical.clc)}</div>
					</div>

					<div class="clinical-line ph">
						<div class="clinical-line-label">P.H</div>
						<div class="clinical-line-rule"></div>
						<div class="clinical-line-value">${escapeHtml(clinical.pastHistory)}</div>
					</div>

					<div class="clinical-line investigation">
						<div class="clinical-line-label">INVESTIGATION</div>
						<div class="clinical-line-rule"></div>
						<div class="clinical-line-value">${escapeHtml(clinical.investigation)}</div>
					</div>

					<div class="clinical-line" style="margin-bottom: 0;">
						<div class="clinical-line-label">IMPRESSION</div>
						<div class="clinical-line-rule"></div>
						<div class="clinical-line-value">${escapeHtml(clinical.impression)}</div>
					</div>
				</aside>

				<section class="rx-panel">
					<div class="rx-title">RX:</div>

					<div class="rx-content">
						${medicineLines}
					</div>

					<div class="signature">
						Dr. ${escapeHtml(doctorName || "Doctor")}
						<span class="signature-line"></span>
					</div>

					<div class="instructions-section">
						<div class="instructions-label">INSTRUCTIONS</div>
						<div class="instructions-box">${escapeHtml(clinical.instructions)}</div>
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