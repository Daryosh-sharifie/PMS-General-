import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import Message from "../ui/Message";
import Loader from "../ui/Loader";
import LabStatusBadge from "../labReports/LabStatusBadge";
import LabResultPreviewModal from "../labReports/LabResultPreviewModal";
import { labOrderApi } from "../../api/labOrderApi";
import { formatDate } from "../../utils/helpers";
import { useLanguage } from "../../i18n/LanguageContext";

function extractOrders(response) {
	if (Array.isArray(response?.data)) return response.data;
	if (Array.isArray(response?.data?.orders)) return response.data.orders;
	if (Array.isArray(response?.orders)) return response.orders;
	if (Array.isArray(response?.data?.labOrders)) return response.data.labOrders;
	return [];
}

function hideCancelledOrders(orders = []) {
	return orders
		.map((order) => ({
			...order,
			items: (Array.isArray(order.items) ? order.items : []).filter(
				(item) => item.status !== "CANCELLED"
			),
		}))
		.filter((order) => order.status !== "CANCELLED" && order.items.length > 0);
}

export default function PrescriptionLabResultsPanel({ prescriptionId }) {
	const { t, language } = useLanguage();
	const isRtl = language === "fa";

	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [selectedOrder, setSelectedOrder] = useState(null);

	useEffect(() => {
		if (!prescriptionId) return;

		const fetchPrescriptionLabOrders = async () => {
			try {
				setLoading(true);
				setError("");

				const response = await labOrderApi.getPrescriptionLabOrders(prescriptionId);
				setOrders(hideCancelledOrders(extractOrders(response)));
			} catch (err) {
				setError(err.message || t("unableToLoadLabReports"));
			} finally {
				setLoading(false);
			}
		};

		fetchPrescriptionLabOrders();
	}, [prescriptionId, t]);

	if (loading) {
		return (
			<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
				<Loader message={t("loadingLabReports")} />
			</div>
		);
	}

	if (error) {
		return (
			<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
				<Message
					type="error"
					title={t("unableToLoadLabReports")}
					description={error}
				/>
			</div>
		);
	}

	return (
		<div
			dir={isRtl ? "rtl" : "ltr"}
			className="rounded-2xl border border-slate-200 bg-white shadow-sm"
		>
			<div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
				<h3 className="text-lg font-bold text-slate-900">
					{t("assignedLabTests")}
				</h3>

				<span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
					{orders.length.toLocaleString(isRtl ? "fa-IR" : "en-US")}{" "}
					{t("orders")}
				</span>
			</div>

			<div className="p-5">
				{orders.length === 0 ? (
					<Message
						type="empty"
						title={t("noAssignedTests")}
						description={t("noLabOrdersForPrescription")}
					/>
				) : (
					<div className="overflow-x-auto rounded-xl border border-slate-200">
						<table
							dir={isRtl ? "rtl" : "ltr"}
							className="normal-dir-table w-full min-w-[900px] table-fixed text-sm"
						>
							<colgroup>
								<col className="w-[6%]" />
								<col className="w-[22%]" />
								<col className="w-[16%]" />
								<col className="w-[14%]" />
								<col className="w-[16%]" />
								<col className="w-[18%]" />
								<col className="w-[8%]" />
							</colgroup>

							<thead>
								<tr className="bg-slate-50 text-slate-600">
									<th className="border-b border-slate-200 px-4 py-3 text-center">
										#
									</th>

									<th className="border-b border-slate-200 px-4 py-3">
										{t("testName")}
									</th>

									<th className="border-b border-slate-200 px-4 py-3">
										{t("category")}
									</th>

									<th className="border-b border-slate-200 px-4 py-3 text-center">
										{t("status")}
									</th>

									<th className="border-b border-slate-200 px-4 py-3">
										{t("requestedDate")}
									</th>

									<th className="border-b border-slate-200 px-4 py-3">
										{t("labNumber")}
									</th>

									<th className="border-b border-slate-200 px-4 py-3 text-center">
										{t("view")}
									</th>
								</tr>
							</thead>

							<tbody>
								{orders.flatMap((order, orderIndex) => {
									const tests = Array.isArray(order.items) ? order.items : [];

									if (!tests.length) {
										return [
											<tr key={order.id} className="hover:bg-slate-50">
												<td className="border-b border-slate-100 px-4 py-3 text-center text-slate-500">
													{orderIndex + 1}
												</td>

												<td className="border-b border-slate-100 px-4 py-3 text-slate-500">
													-
												</td>

												<td className="border-b border-slate-100 px-4 py-3 text-slate-500">
													-
												</td>

												<td className="border-b border-slate-100 px-4 py-3 text-center">
													<LabStatusBadge status={order.status} />
												</td>

												<td className="border-b border-slate-100 px-4 py-3 text-slate-700">
													{formatDate(order.createdAt, language)}
												</td>

												<td className="ltr-value border-b border-slate-100 px-4 py-3 font-semibold text-slate-900">
													{order.labOrderNo || "-"}
												</td>

												<td className="border-b border-slate-100 px-4 py-3 text-center">
													<button
														type="button"
														onClick={() => setSelectedOrder(order)}
														className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-700 hover:bg-blue-100"
														title={t("viewReport")}
													>
														<Eye className="h-4 w-4" />
													</button>
												</td>
											</tr>,
										];
									}

									return tests.map((item, testIndex) => {
										const rowNumber = `${orderIndex + 1}.${testIndex + 1}`;

										return (
											<tr
												key={`${order.id}-${item.id || testIndex}`}
												className="hover:bg-slate-50"
											>
												<td className="border-b border-slate-100 px-4 py-3 text-center text-slate-500">
													{rowNumber}
												</td>

												<td className="border-b border-slate-100 px-4 py-3 text-slate-700">
													{item.testNameSnapshot || item.test?.name || "-"}
												</td>

												<td className="border-b border-slate-100 px-4 py-3 text-slate-700">
													{item.categorySnapshot || item.test?.category || "-"}
												</td>

												<td className="border-b border-slate-100 px-4 py-3 text-center">
													<LabStatusBadge status={item.status} type="item" />
												</td>

												<td className="border-b border-slate-100 px-4 py-3 text-slate-700">
													{testIndex === 0
														? formatDate(order.createdAt, language)
														: ""}
												</td>

												<td className="ltr-value border-b border-slate-100 px-4 py-3 font-semibold text-slate-900">
													{testIndex === 0 ? order.labOrderNo || "-" : ""}
												</td>

												<td className="border-b border-slate-100 px-4 py-3 text-center">
													<button
														type="button"
														onClick={() => setSelectedOrder(order)}
														className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-700 hover:bg-blue-100"
														title={t("viewReport")}
													>
														<Eye className="h-4 w-4" />
													</button>
												</td>
											</tr>
										);
									});
								})}
							</tbody>
						</table>
					</div>
				)}
			</div>

			<LabResultPreviewModal
				open={Boolean(selectedOrder)}
				order={selectedOrder}
				onClose={() => setSelectedOrder(null)}
			/>
		</div>
	);
}
