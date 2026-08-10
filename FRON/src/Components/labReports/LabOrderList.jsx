import { Search, Filter } from "lucide-react";
import Message from "../ui/Message";
import Loader from "../ui/Loader";
import LabOrderCard from "./LabOrderCard";
import LabStatusBadge from "./LabStatusBadge";
import { LAB_ORDER_STATUS_OPTIONS } from "./labReportConstants";
import { formatDate } from "../../utils/helpers";
import { useLanguage } from "../../i18n/LanguageContext";
import { inputClasses } from "../../constants/styles";

export default function LabOrderList({
	orders,
	loading,
	error,
	searchTerm,
	setSearchTerm,
	statusFilter,
	setStatusFilter,
	currentPage,
	totalPages,
	totalRecords,
	onPageChange,
	onOpenOrder,
}) {
	const { t, language } = useLanguage();
	const isRtl = language === "fa";
	const numberLocale = isRtl ? "fa-IR" : "en-US";

	if (loading) {
		return <Loader fullHeight message={t("loadingLabReports")} />;
	}

	if (error) {
		return (
			<Message
				type="error"
				title={t("unableToLoadLabReports")}
				description={error}
				fullHeight
			/>
		);
	}

	return (
		<div
			dir={isRtl ? "rtl" : "ltr"}
			className="flex h-full min-h-0 flex-col space-y-5 overflow-hidden"
		>
			<div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
				<div className="space-y-5">
					<div className="flex flex-col gap-3 lg:flex-row lg:items-center">
						<div className="relative flex-1">
							<Search
								className={`pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 ${
									isRtl ? "right-4" : "left-4"
								}`}
							/>

							<input
								type="search"
								value={searchTerm}
								onChange={(event) => setSearchTerm(event.target.value)}
								placeholder={t("searchPatientLabPrescription")}
								className={`${inputClasses} ${
									isRtl ? "pl-4 pr-12 text-right" : "pl-12 pr-4 text-left"
								}`}
								dir={isRtl ? "rtl" : "ltr"}
							/>
						</div>

						<div className="flex h-10 min-w-[120px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-5 text-base text-slate-700">
							<span className="font-bold text-slate-950">
								{Number(totalRecords || 0).toLocaleString(numberLocale)}
							</span>

							<span className={isRtl ? "mr-1" : "ml-1"}>
								{t("orders")}
							</span>
						</div>
					</div>

					<div
						dir={isRtl ? "rtl" : "ltr"}
						className="flex flex-wrap items-center gap-3"
						style={{ justifyContent: "flex-start" }}
					>
						<div className="flex items-center gap-2 text-sm font-bold text-slate-600">
							<Filter className="h-4 w-4" />
							<span>{t("status")}:</span>
						</div>

						{LAB_ORDER_STATUS_OPTIONS.map((option) => {
							const isActive = statusFilter === option.value;

							return (
								<button
									key={option.value}
									type="button"
									onClick={() => setStatusFilter(option.value)}
									className={`rounded-full px-3 py-2 text-sm font-bold transition ${
										isActive
											? "bg-blue-600 text-white shadow-sm"
											: "bg-slate-100 text-slate-700 hover:bg-slate-200"
									}`}
								>
									{t(option.labelKey)}
								</button>
							);
						})}
					</div>
				</div>
			</div>

			<div className="hidden min-h-0 flex-1 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
				<table
					dir={isRtl ? "rtl" : "ltr"}
					className="normal-dir-table w-full min-w-[980px] table-fixed divide-y divide-slate-200"
				>
					<colgroup>
						<col className="w-[18%]" />
						<col className="w-[14%]" />
						<col className="w-[15%]" />
						<col className="w-[15%]" />
						<col className="w-[13%]" />
						<col className="w-[10%]" />
						<col className="w-[8%]" />
						<col className="w-[7%]" />
					</colgroup>

					<thead className="sticky top-0 z-10 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
						<tr>
							<th className="whitespace-nowrap px-4 py-4">
								{t("labNumber")}
							</th>

							<th className="whitespace-nowrap px-4 py-4">
								{t("patient")}
							</th>

							<th className="whitespace-nowrap px-4 py-4">
								{t("doctor")}
							</th>

							<th className="whitespace-nowrap px-4 py-4">
								{t("prescription")}
							</th>

							<th className="whitespace-nowrap px-4 py-4">
								{t("requestedDate")}
							</th>

							<th className="whitespace-nowrap px-4 py-4 text-center">
								{t("testsCount")}
							</th>

							<th className="whitespace-nowrap px-4 py-4 text-center">
								{t("status")}
							</th>

							<th className="whitespace-nowrap px-4 py-4 text-center">
								{t("actions")}
							</th>
						</tr>
					</thead>

					<tbody className="divide-y divide-slate-100 text-sm">
						{orders.length > 0 ? (
							orders.map((order) => (
								<tr key={order.id} className="transition hover:bg-slate-50">
									<td className="rtl-value truncate px-4 py-4 font-bold text-slate-950">
										{order.labOrderNo}
									</td>

									<td className="truncate px-4 py-4 text-slate-700">
										{order.patientName || order.patient?.fullname || "-"}
									</td>

									<td className="truncate px-4 py-4 text-slate-700">
										{order.doctorName || order.requestedBy?.name || "-"}
									</td>

									<td className="ltr-value truncate px-4 py-4 text-slate-700">
										{order.prescriptionNo ||
											order.prescription?.prescriptionNo ||
											"-"}
									</td>

									<td className="truncate px-4 py-4 text-slate-700">
										{formatDate(order.createdAt, language)}
									</td>

									<td className="px-4 py-4 text-center text-slate-700">
										{Array.isArray(order.items)
											? Number(order.items.length).toLocaleString(numberLocale)
											: Number(0).toLocaleString(numberLocale)}
									</td>

									<td className="px-4 py-4 text-center">
										<LabStatusBadge status={order.status} />
									</td>

									<td className="px-4 py-4 text-center">
										<button
											type="button"
											onClick={() => onOpenOrder?.(order.id)}
											className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-50"
										>
											{t("open")}
										</button>
									</td>
								</tr>
							))
						) : (
							<tr>
								<td colSpan={8} className="px-4 py-10">
									<Message
										type="empty"
										title={t("noLabOrdersFound")}
										description={t("tryChangingSearchOrStatus")}
									/>
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			<div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-3 lg:hidden">
				{orders.length > 0 ? (
					orders.map((order) => (
						<LabOrderCard key={order.id} order={order} onOpen={onOpenOrder} />
					))
				) : (
					<Message
						type="empty"
						title={t("noLabOrdersFound")}
						description={t("tryChangingSearchOrStatus")}
					/>
				)}
			</div>

			{totalPages > 1 && (
				<div className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-t border-slate-100 pt-3">
					<button
						type="button"
						disabled={currentPage <= 1}
						onClick={() => onPageChange(currentPage - 1)}
						className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
					>
						{t("prev")}
					</button>

					<span className="text-sm text-slate-600">
						{t("page")}{" "}
						{Number(currentPage).toLocaleString(numberLocale)} {t("of")}{" "}
						{Number(totalPages).toLocaleString(numberLocale)}
					</span>

					<button
						type="button"
						disabled={currentPage >= totalPages}
						onClick={() => onPageChange(currentPage + 1)}
						className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
					>
						{t("next")}
					</button>
				</div>
			)}
		</div>
	);
}