import { useState } from "react";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent } from "../ui/Card";
import Message from "../ui/Message";
import Loader from "../ui/Loader";
import LabStatusBadge from "./LabStatusBadge";
import PatientInfoCard from "./PatientInfoCard";
import BulkLabResultForm from "./BulkLabResultForm";
import LabReportPrintView from "./LabReportPrintView";
import LabResultPreviewModal from "./LabResultPreviewModal";
import { labOrderItemApi } from "../../api/labOrderItemApi";
import { getLabOrderDisplayName, getLabOrderTestCount } from "./labReportHelpers";
import { formatDate } from "../../utils/helpers";

const EDITABLE_BULK_STATUSES = ["REQUESTED", "IN_PROGRESS", "COMPLETED"];

function getPatientName(order) {
	return order?.patientName || order?.patient?.fullname || order?.patient?.name || "-";
}

function getDoctorName(order) {
	return order?.doctorName || order?.requestedBy?.name || order?.doctor?.name || "-";
}

function getPrescriptionNo(order) {
	return order?.prescriptionNo || order?.prescription?.prescriptionNo || "-";
}

export default function LabOrderDetail({ order, loading, error, onReload }) {
	const navigate = useNavigate();
	const [showBulkForm, setShowBulkForm] = useState(false);
	const [showPreview, setShowPreview] = useState(false);
	const [bulkSaving, setBulkSaving] = useState(false);
	const [message, setMessage] = useState("");
	const [messageType, setMessageType] = useState("info");

	const flash = (type, text) => {
		setMessageType(type);
		setMessage(text);
		window.clearTimeout(window.__labFlashTimeout);
		window.__labFlashTimeout = window.setTimeout(() => setMessage(""), 2800);
	};

	const handleSaveAllResults = async (resultsByItemId) => {
		try {
			setBulkSaving(true);

			const editableItems = (order?.items || []).filter((item) =>
				EDITABLE_BULK_STATUSES.includes(item.status)
			);

			await Promise.all(
				editableItems.map(async (item) => {
					const payload = resultsByItemId[item.id];
					if (!payload) return;

					if (item.status === "REQUESTED") {
						await labOrderItemApi.startLabTest(item.id);
					}

					await labOrderItemApi.saveLabResult(
						item.id,
						payload.manualResults || {},
						payload.remarks || ""
					);
				})
			);

			flash("success", "Lab results saved successfully");
			setShowBulkForm(false);
			await onReload?.();
		} catch (err) {
			flash("error", err.message || "Failed to save lab results");
		} finally {
			setBulkSaving(false);
		}
	};

	const handleVerifyCompleted = async () => {
		const completedItems = (order?.items || []).filter(
			(item) => item.status === "COMPLETED"
		);

		if (!completedItems.length) {
			flash("error", "No completed results available for verification");
			return;
		}

		const ok = window.confirm("Verify all completed lab results?");
		if (!ok) return;

		try {
			await Promise.all(
				completedItems.map((item) => labOrderItemApi.verifyLabResult(item.id))
			);

			flash("success", "Completed lab results verified");
			await onReload?.();
		} catch (err) {
			flash("error", err.message || "Failed to verify completed results");
		}
	};

	if (loading) {
		return <Loader fullHeight message="Loading lab order..." />;
	}

	if (error || !order) {
		return (
			<Message
				type="error"
				title="Lab order not found"
				description={error || "The requested order could not be loaded."}
				fullHeight
			/>
		);
	}

	const items = order.items || [];

	return (
		<>
			<div className="h-full min-h-0 overflow-y-auto bg-slate-50 p-4 md:p-6 print:hidden">
				<div className="mx-auto max-w-6xl space-y-6">
					<div className="flex items-center justify-between gap-3">
						<button
							type="button"
							onClick={() => navigate(-1)}
							className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
						>
							Back
						</button>

						<div className="text-right">
							<h2 className="text-2xl font-bold text-slate-900">
								{getLabOrderDisplayName(order)}
							</h2>
							<p className="text-sm text-slate-500">Lab Order Detail</p>
						</div>
					</div>

					{message && (
						<div
							className={`rounded-xl border p-4 text-sm ${
								messageType === "success"
									? "border-emerald-200 bg-emerald-50 text-emerald-800"
									: messageType === "error"
									? "border-rose-200 bg-rose-50 text-rose-800"
									: "border-blue-200 bg-blue-50 text-blue-800"
							}`}
						>
							{message}
						</div>
					)}

					<div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
						<div className="space-y-6">
							<PatientInfoCard order={order} />

							<Card>
								<CardHeader>
									<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
										<LabStatusBadge status={order.status} />

										<div className="flex flex-wrap items-center justify-end gap-2">
											<button
												type="button"
												onClick={() => setShowBulkForm(true)}
												className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
											>
												Add Results
											</button>

											<button
												type="button"
												onClick={handleVerifyCompleted}
												className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
											>
												Verify Completed
											</button>
										</div>

										<h3 className="text-right text-lg font-semibold text-gray-900">
											Assigned Lab Tests
										</h3>
									</div>
								</CardHeader>

								<CardContent>
									<div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
										<table className="w-full min-w-[720px] text-sm">
											<thead>
												<tr className="bg-slate-50 text-slate-600">
													<th className="border-b border-r border-slate-200 px-4 py-3 text-left">
														Test Name
													</th>
													<th className="border-b border-r border-slate-200 px-4 py-3 text-left">
														Category
													</th>
													<th className="border-b border-r border-slate-200 px-4 py-3 text-left">
														Status
													</th>
													<th className="border-b border-r border-slate-200 px-4 py-3 text-left">
														Completed At
													</th>
													<th className="border-b border-slate-200 px-4 py-3 text-center">
														View
													</th>
												</tr>
											</thead>

											<tbody>
												{items.length ? (
													items.map((item) => (
														<tr key={item.id} className="hover:bg-slate-50">
															<td className="border-b border-r border-slate-100 px-4 py-3 font-semibold text-slate-900">
																{item.testNameSnapshot || "Lab Test"}
															</td>

															<td className="border-b border-r border-slate-100 px-4 py-3 text-slate-700">
																{item.categorySnapshot || "General"}
															</td>

															<td className="border-b border-r border-slate-100 px-4 py-3">
																<LabStatusBadge
																	status={item.status}
																	type="item"
																/>
															</td>

															<td className="border-b border-r border-slate-100 px-4 py-3 text-slate-700">
																{item.completedAt
																	? formatDate(item.completedAt)
																	: "-"}
															</td>

															<td className="border-b border-slate-100 px-4 py-3 text-center">
																<button
																	type="button"
																	onClick={() => setShowPreview(true)}
																	className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50"
																	title="View report"
																>
																	<Eye className="h-4 w-4" />
																</button>
															</td>
														</tr>
													))
												) : (
													<tr>
														<td colSpan={5} className="px-4 py-8">
															<Message
																type="empty"
																title="No assigned tests"
																description="This lab order does not contain any tests."
															/>
														</td>
													</tr>
												)}
											</tbody>
										</table>
									</div>
								</CardContent>
							</Card>
						</div>

						<div className="space-y-6">
							<Card>
								<CardHeader>
									<h3 className="text-right text-lg font-semibold text-gray-900">
										Order Summary
									</h3>
								</CardHeader>

								<CardContent className="space-y-3 text-right text-sm text-slate-700">
									<p>
										<span className="font-semibold text-slate-900">
											Lab Number:
										</span>{" "}
										{order.labOrderNo || "-"}
									</p>

									<p>
										<span className="font-semibold text-slate-900">
											Patient:
										</span>{" "}
										{getPatientName(order)}
									</p>

									<p>
										<span className="font-semibold text-slate-900">
											Doctor:
										</span>{" "}
										{getDoctorName(order)}
									</p>

									<p>
										<span className="font-semibold text-slate-900">
											Prescription:
										</span>{" "}
										{getPrescriptionNo(order)}
									</p>

									<p>
										<span className="font-semibold text-slate-900">
											Order Date:
										</span>{" "}
										{formatDate(order.createdAt)}
									</p>

									<p>
										<span className="font-semibold text-slate-900">
											Tests Count:
										</span>{" "}
										{getLabOrderTestCount(order)}
									</p>

									<p>
										<span className="font-semibold text-slate-900">Notes:</span>{" "}
										{order.notes || "-"}
									</p>

									<div className="flex flex-wrap justify-end gap-2 pt-2">
										<button
											type="button"
											onClick={() => setShowPreview(true)}
											className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
										>
											View Report
										</button>

										<button
											type="button"
											onClick={() => window.print()}
											className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
										>
											Print Report
										</button>

										<button
											type="button"
											onClick={onReload}
											className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
										>
											Refresh
										</button>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</div>

				<BulkLabResultForm
					open={showBulkForm}
					order={order}
					saving={bulkSaving}
					onSaveAll={handleSaveAllResults}
					onClose={() => setShowBulkForm(false)}
				/>

				<LabResultPreviewModal
					open={showPreview}
					order={order}
					onClose={() => setShowPreview(false)}
				/>
			</div>

			<LabReportPrintView order={order} />

			<style>{`
				@media print {
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

					@page {
						size: A4;
						margin: 8mm;
					}
				}
			`}</style>
		</>
	);
}