import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, FlaskConical } from "lucide-react";
import { CardContent } from "../ui/Card";
import Message from "../ui/Message";
import { labTestApi } from "../../api/labTestApi";
import AddLabTestModal from "./AddLabTestModal";
import LabOrderList from "./LabOrderList";
import { useLabOrders } from "./useLabOrders";
import { useLanguage } from "../../i18n/LanguageContext";

export default function LabReportsPage() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const { t } = useLanguage();

	const initialPatientId = searchParams.get("patientId") || "";
	const initialPrescriptionId = searchParams.get("prescriptionId") || "";

	const [searchTerm, setSearchTerm] = useState(
		initialPatientId || initialPrescriptionId || ""
	);
	const [statusFilter, setStatusFilter] = useState("all");
	const [currentPage, setCurrentPage] = useState(1);
	const [showAddLabTestModal, setShowAddLabTestModal] = useState(false);
	const [savingLabTest, setSavingLabTest] = useState(false);
	const [addLabTestError, setAddLabTestError] = useState("");

	const pageSize = 10;
	const { orders, loading, error } = useLabOrders();

	const filteredOrders = useMemo(() => {
		const query = searchTerm.trim().toLowerCase();

		return orders.filter((order) => {
			const matchesStatus = statusFilter === "all" || order.status === statusFilter;

			if (!matchesStatus) return false;
			if (!query) return true;

			return [
				order.patientName,
				order.labOrderNo,
				order.prescriptionNo,
				order.doctorName,
			]
				.filter(Boolean)
				.some((value) => String(value).toLowerCase().includes(query));
		});
	}, [orders, searchTerm, statusFilter]);

	const totalRecords = filteredOrders.length;
	const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
	const currentOrders = filteredOrders.slice(
		(currentPage - 1) * pageSize,
		currentPage * pageSize
	);

	const handlePageChange = (page) => {
		setCurrentPage(Math.min(Math.max(page, 1), totalPages));
	};

	const handleCreateLabTest = async (payload) => {
		try {
			setSavingLabTest(true);
			setAddLabTestError("");
			await labTestApi.createLabTest(payload);
		} catch (err) {
			setAddLabTestError(err.message || "Failed to create lab test");
			throw err;
		} finally {
			setSavingLabTest(false);
		}
	};

	return (
		<div className="space-y-6 p-4 md:p-6">
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 sm:h-12 sm:w-12 shadow-md shadow-indigo-500/10 ring-2 ring-indigo-500/20 modern-icon-badge transition-all">
						<FlaskConical className="h-5 w-5 sm:h-6 sm:w-6 animate-modern-header-icon" />
					</div>

					<div>
						<h2 className="text-right text-3xl font-bold text-slate-900">
							{t("labReports")}
						</h2>
						<p className="text-right text-sm text-slate-500">
							{t("labReportsSubtitle")}
						</p>
					</div>
				</div>

				<div className="rounded-2xl flex gap-6 bg-blue-50 px-4 py-3 text-right">
					<button
						type="button"
						onClick={() => {
							setAddLabTestError("");
							setShowAddLabTestModal(true);
						}}
						className="mt-1 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
					>
						<Plus className="h-4 w-4" />
						{t("addLabTest")}
					</button>
				</div>

			</div>

			<CardContent>
				<LabOrderList
					orders={currentOrders}
					loading={loading}
					error={error}
					searchTerm={searchTerm}
					setSearchTerm={(value) => {
						setSearchTerm(value);
						setCurrentPage(1);
					}}
					statusFilter={statusFilter}
					setStatusFilter={(value) => {
						setStatusFilter(value);
						setCurrentPage(1);
					}}
					currentPage={currentPage}
					totalPages={totalPages}
					totalRecords={totalRecords}
					onPageChange={handlePageChange}
					onOpenOrder={(id) => navigate(`/lab-reports/${id}`)}
				/>
			</CardContent>

			{!loading && !error && filteredOrders.length === 0 && (
				<Message
					type="empty"
					title={t("noLabRequestsFound")}
					description={t("createLabOrderFromPrescription")}
				/>
			)}

			<AddLabTestModal
				open={showAddLabTestModal}
				onClose={() => setShowAddLabTestModal(false)}
				onSubmit={handleCreateLabTest}
				saving={savingLabTest}
				error={addLabTestError}
			/>
		</div>
	);
}
