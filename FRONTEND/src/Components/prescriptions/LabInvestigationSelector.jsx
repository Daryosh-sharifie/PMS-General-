import { ChevronDown, Plus, Search, X } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";

export default function LabInvestigationSelector({
	selectedLabTestIds = [],
	selectedLabTests = [],
	filteredLabTests = [],
	labTestSearch = "",
	setLabTestSearch,
	showLabDropdown,
	setShowLabDropdown,
	loadingLabTests,
	labRequestError,
	selectLabTest,
	removeLabTest,
}) {
	const { t, language } = useLanguage();
	const isRtl = language === "fa";

	const safeSelectedCount = Array.isArray(selectedLabTestIds)
		? selectedLabTestIds.length
		: 0;

	const handleSelectLabTest = (test) => {
		if (!test?.id) return;
		selectLabTest?.(test);
	};

	const handleRemoveLabTest = (test) => {
		if (!test?.id) return;
		removeLabTest?.(test.id);
	};

	return (
		<div
			dir={isRtl ? "rtl" : "ltr"}
			className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(220px,0.85fr)_minmax(360px,1.35fr)] lg:items-stretch"
		>
			<div className="relative rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2 print:hidden">
				<p className="mb-1 text-start text-xs font-bold text-slate-800">
					{t("addLabTest")}
				</p>
				<button
					type="button"
					onClick={() => setShowLabDropdown?.((prev) => !prev)}
					className="flex w-full items-center justify-between rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
				>
					<span className="flex items-center gap-2">
						<Plus className="h-4 w-4" />
						{t("addLabTest")}
					</span>
					<ChevronDown className="h-4 w-4" />
				</button>

				{showLabDropdown && (
					<div className="absolute left-3 right-3 z-30 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
						<div className="relative border-b border-slate-100 p-2">
							<Search className="pointer-events-none absolute start-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
							<input
								type="search"
								placeholder={t("searchLabTestsPlaceholder")}
								value={labTestSearch}
								onChange={(event) => setLabTestSearch?.(event.target.value)}
								className="w-full rounded-lg border border-slate-200 px-9 py-2 text-xs outline-none focus:border-blue-400"
								autoFocus
							/>
						</div>

						<div className="max-h-56 overflow-y-auto">
							{loadingLabTests ? (
								<div className="p-4 text-center text-xs text-slate-500">
									{t("loadingLabTests")}
								</div>
							) : filteredLabTests.length === 0 ? (
								<div className="p-4 text-center text-xs text-slate-500">
									{t("noLabTestFound")}
								</div>
							) : (
								filteredLabTests.map((test) => (
									<button
										key={test.id}
										type="button"
										onClick={() => handleSelectLabTest(test)}
										className="flex w-full items-center justify-between gap-3 border-b border-slate-50 px-3 py-2.5 transition hover:bg-blue-50"
									>
										<div className="min-w-0">
											<p className="text-xs font-semibold text-slate-800">
												{test.name}
											</p>
											<p className="text-[10px] text-slate-500">
												{test.category || t("general")}
											</p>
										</div>
										<Plus className="h-4 w-4 text-blue-500" />
									</button>
								))
							)}
						</div>
					</div>
				)}
			</div>

			<div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
				<div className="mb-2 flex items-center justify-between gap-3">
					<div>
						<p className="text-start text-xs font-bold text-slate-800">
							{t("currentVisitLabTests")}
						</p>
						<p className="text-start text-[11px] text-slate-500">
							{t("currentVisitLabTestsSubtitle")}
						</p>
					</div>

					<span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
						{safeSelectedCount}
					</span>
				</div>

				{selectedLabTests.length > 0 ? (
					<div className="flex max-h-16 flex-wrap gap-2 overflow-y-auto pr-1">
						{selectedLabTests
							.filter((test) => test?.id)
							.map((test) => (
								<span
									key={test.id}
									className="inline-flex max-w-full items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-800"
								>
									<span className="max-w-[170px] truncate">{test.name}</span>

									<button
										type="button"
										onClick={() => handleRemoveLabTest(test)}
										className="rounded-full p-0.5 text-blue-500 transition hover:bg-red-50 hover:text-red-500"
										title={t("remove")}
									>
										<X className="h-3 w-3" />
									</button>
								</span>
							))}
					</div>
				) : (
					<div className="rounded-lg bg-slate-50 px-3 py-2 text-start text-xs text-slate-500">
						{t("noLabTestsSelectedForVisit")}
					</div>
				)}
			</div>

			{labRequestError && (
				<div className="col-span-full mt-1 rounded-lg border border-red-200 bg-red-50 p-2 text-left text-xs text-red-700">
					{labRequestError}
				</div>
			)}
		</div>
	);
}
