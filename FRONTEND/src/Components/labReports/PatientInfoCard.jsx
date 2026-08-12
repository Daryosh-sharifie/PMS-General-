import { Card, CardHeader, CardContent } from "../ui/Card";
import { formatAfghanDate } from "../../utils/afghanCalendar";

export default function PatientInfoCard({ order }) {
	if (!order) return null;

	return (
		<Card>
			<CardHeader>
				<h3 className="text-right text-lg font-semibold text-gray-900">Patient Information</h3>
			</CardHeader>
			<CardContent className="grid gap-4 text-right md:grid-cols-2">
				<Info label="Patient" value={order.patientName || order.patient?.fullname || "-"} />
				<Info label="Father" value={order.patientFathername || order.patient?.fathername || "-"} />
				<Info label="Doctor" value={order.doctorName || order.requestedBy?.name || "-"} />
				<Info label="Lab Number" value={order.labOrderNo} />
				<Info label="Prescription No" value={order.prescriptionNo || order.prescription?.prescriptionNo || "-"} />
				<Info
					label="Requested Date"
					value={formatAfghanDate(order.createdAt, { englishDigits: true })}
				/>
			</CardContent>
		</Card>
	);
}

function Info({ label, value }) {
	return (
		<div className="rounded-xl bg-slate-50 p-3">
			<p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
			<p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
		</div>
	);
}