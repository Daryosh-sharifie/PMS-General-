import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUserWithPrescriptions } from "../../api/userApi";
import { Card, CardHeader, CardContent } from "../ui/Card";
import Badge from "../ui/Badge";
import { buttonSecondary, buttonGhost } from "../../constants/styles";
import { Eye, Stethoscope, FileText, Mail, ShieldCheck } from "lucide-react";
import { formatDate, getStatusColor, getStatusLabel } from "../../utils/helpers";
import { useLanguage } from "../../i18n/LanguageContext";

function extractDoctor(response) {
	return response?.data?.user || response?.user || response?.data || response || null;
}

function normalizePrescriptions(doctor) {
	const list = doctor?.prescription || doctor?.prescriptions || [];

	return Array.isArray(list) ? list : [];
}

function getRoleLabel(role, t) {
	const value = String(role || "").toLowerCase();

	const roleMap = {
		admin: "admin",
		doctor: "doctor",
		pharmacist: "pharmacist",
		reciption: "reception",
		reception: "reception",
		labstaff: "labStaff",
	};

	return t(roleMap[value] || value) || role || "-";
}

export default function DoctorPrescriptions({ onViewPrescription }) {
	const navigate = useNavigate();
	const { id } = useParams();
	const { t, language } = useLanguage();

	const [doctor, setDoctor] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		let active = true;

		const load = async () => {
			try {
				setLoading(true);
				setError("");

				const response = await getUserWithPrescriptions(id);
				const user = extractDoctor(response);

				if (!active) return;

				if (!user?.id) {
					setDoctor(null);
					setError(t("doctorNotFound"));
					return;
				}

				setDoctor(user);
			} catch (err) {
				if (active) {
					setError(err.message || t("failedToLoadDoctorPrescriptions"));
				}
			} finally {
				if (active) setLoading(false);
			}
		};

		load();

		return () => {
			active = false;
		};
	}, [id, t]);

	const prescriptions = useMemo(() => normalizePrescriptions(doctor), [doctor]);

	const handleViewPrescription = (prescriptionId) => {
		if (onViewPrescription) {
			onViewPrescription(prescriptionId);
			return;
		}

		navigate(`/prescriptions/${prescriptionId}`);
	};

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center text-sm font-semibold text-slate-500">
				{t("loadingDoctorPrescriptions")}
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex h-screen flex-col items-center justify-center gap-3 text-center">
				<p className="text-lg font-bold text-red-600">{error}</p>
				<button
					type="button"
					className={buttonSecondary}
					onClick={() => navigate("/users")}
				>
					{t("back")}
				</button>
			</div>
		);
	}

	if (!doctor) {
		return (
			<div className="flex h-screen flex-col items-center justify-center gap-3 text-center">
				<p className="text-lg font-bold text-slate-800">{t("doctorNotFound")}</p>
				<button
					type="button"
					className={buttonSecondary}
					onClick={() => navigate("/users")}
				>
					{t("back")}
				</button>
			</div>
		);
	}

	return (
		<div className="space-y-6 p-4 md:p-6">
			<div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<button
						type="button"
						className={`${buttonSecondary} w-fit`}
						onClick={() => navigate(-1)}
					>
						{t("back")}
					</button>

					<div className="flex items-center justify-end gap-4 text-right">
						<div>
							<h2 className="text-3xl font-bold text-slate-950">
								{t("doctorPrefix")} {doctor.name}
							</h2>
							<div className="mt-2 flex flex-wrap items-center justify-end gap-2 text-sm text-slate-500">
								<span className="inline-flex items-center gap-1">
									<Mail className="h-4 w-4" />
									{doctor.email || "-"}
								</span>
								<span>•</span>
								<span className="inline-flex items-center gap-1">
									<ShieldCheck className="h-4 w-4" />
									{getRoleLabel(doctor.role, t)}
								</span>
							</div>
						</div>

						<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
							<Stethoscope className="h-7 w-7" />
						</div>
					</div>
				</div>
			</div>

			<Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
				<CardHeader className="border-b border-slate-100 px-5 py-4">
					<div className="flex items-center justify-between gap-3">
						<p className="text-sm font-semibold text-blue-600">
							{prescriptions.length.toLocaleString(language === "fa" ? "fa-IR" : "en-US")}
						</p>
						<div className="text-right">
							<h3 className="text-lg font-bold text-slate-950">
								{t("doctorPrescriptions")}
							</h3>
							<p className="mt-1 text-xs text-slate-500">
								{t("doctorPrescriptionsSubtitle")}
							</p>
						</div>
					</div>
				</CardHeader>

				<CardContent className="p-0">
					{prescriptions.length === 0 ? (
						<div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
							<div className="mb-3 rounded-2xl bg-slate-50 p-4 text-slate-400">
								<FileText className="h-8 w-8" />
							</div>
							<p className="font-bold text-slate-700">{t("noPrescriptionsFound")}</p>
							<p className="mt-1 text-sm text-slate-500">
								{t("noDoctorPrescriptionsDescription")}
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="min-w-full">
								<thead className="border-b border-slate-200 bg-slate-50">
									<tr>
										<Th align="right">{t("prescriptionNumber")}</Th>
										<Th align="right">{t("patient")}</Th>
										<Th>{t("date")}</Th>
										<Th align="right">{t("diagnosis")}</Th>
										<Th>{t("status")}</Th>
										<Th>{t("actions")}</Th>
									</tr>
								</thead>

								<tbody className="divide-y divide-slate-100">
									{prescriptions.map((prescription) => (
										<tr key={prescription.id} className="transition hover:bg-slate-50">
											<td className="px-4 py-4 text-right font-bold text-blue-700">
												{prescription.prescriptionNo || prescription.id}
											</td>

											<td className="px-4 py-4 text-right font-semibold text-slate-900">
												{prescription.patientName || "-"}
											</td>

											<td className="px-4 py-4 text-center text-slate-700">
												{formatDate(prescription.date || prescription.createdAt, language)}
											</td>

											<td className="px-4 py-4 text-right text-slate-700">
												{prescription.diagnosis || "-"}
											</td>

											<td className="px-4 py-4 text-center">
												<Badge className={getStatusColor(prescription.status)}>
													{getStatusLabel(prescription.status, t)}
												</Badge>
											</td>

											<td className="px-4 py-4 text-center">
												<button
													type="button"
													className={`${buttonGhost} px-2 py-1`}
													onClick={() => handleViewPrescription(prescription.id)}
													title={t("viewPrescription")}
												>
													<Eye className="h-4 w-4" />
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

function Th({ children, align = "center" }) {
	return (
		<th
			className={`px-4 py-3 text-${align} text-xs font-bold uppercase tracking-wide text-slate-500`}
		>
			{children}
		</th>
	);
}