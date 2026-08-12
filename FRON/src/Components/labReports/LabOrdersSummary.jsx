import { Card, CardHeader, CardContent } from "../ui/Card";
import Message from "../ui/Message";
import LabStatusBadge from "./LabStatusBadge";
import { formatAfghanDate } from "../../utils/afghanCalendar";

export default function LabOrdersSummary({ title = "Lab Reports", orders = [], onOpenOrder, onPrintOrder, emptyText = "No lab reports found." }) {
	return (
		<Card>
			<CardHeader>
				<h3 className="text-right text-lg font-semibold text-gray-900">{title}</h3>
			</CardHeader>
			<CardContent>
				{orders.length > 0 ? (
					<div className="space-y-3">
						{orders.map((order) => (
							<div key={order.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
								<div className="flex items-start justify-between gap-3">
									<div className="space-y-1 text-right">
										<p className="text-sm font-bold text-slate-900">{order.labOrderNo}</p>
										<p className="text-xs text-slate-500">{order.patientName || order.patient?.fullname || "-"} • {formatAfghanDate(order.createdAt, { englishDigits: true })}</p>
									</div>
									<LabStatusBadge status={order.status} />
								</div>
								<div className="mt-3 flex flex-wrap justify-end gap-2">
									{onOpenOrder && (
										<button type="button" onClick={() => onOpenOrder(order.id)} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">Open Details</button>
									)}
									{onPrintOrder && (
										<button type="button" onClick={() => onPrintOrder(order)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Print Report</button>
									)}
								</div>
							</div>
						))}
					</div>
				) : (
					<Message type="empty" title={title} description={emptyText} />
				)}
			</CardContent>
		</Card>
	);
}