import { Plus, X } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";

export default function PageControls({
	pages,
	currentPageId,
	setCurrentPageId,
	handleAddPage,
	handleRemovePage,
}) {
	const { t } = useLanguage();

	return (
		<div className="mt-4 flex flex-wrap items-center gap-2 print:hidden">
			{pages.length > 1 &&
				pages.map((page, idx) => (
					<div key={page.id} className="group relative">
						<button
							type="button"
							onClick={() => setCurrentPageId(page.id)}
							className={`h-9 w-9 rounded-xl font-medium transition-all ${
								currentPageId === page.id
									? "bg-blue-600 text-white shadow-sm"
									: "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
							}`}
							title={`${t("page")} ${idx + 1}`}
						>
							{idx + 1}
						</button>

						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								handleRemovePage(page.id);
							}}
							className="absolute -right-2 -top-2 flex h-5 w-5 scale-75 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-sm transition-all group-hover:scale-100 group-hover:opacity-100 hover:bg-red-600"
							title={t("removePage")}
						>
							<X className="h-3 w-3" />
						</button>
					</div>
				))}

			<button
				type="button"
				onClick={handleAddPage}
				className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-600 ring-1 ring-slate-200 transition hover:bg-blue-600 hover:text-white"
				title={t("addPage")}
			>
				<Plus className="h-4 w-4" />
			</button>
		</div>
	);
}