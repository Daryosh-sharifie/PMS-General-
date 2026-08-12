import { Languages } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";

export default function LanguageSwitcher() {
	const { language, setLanguage } = useLanguage();

	const options = [
		{ value: "en", label: "English" },
		{ value: "fa", label: "دری" },
	];

	return (
		<div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
			<div className="hidden items-center gap-1 px-2 text-xs font-bold text-slate-500 sm:flex">
				<Languages className="h-4 w-4" />
				<span>{language === "fa" ? "زبان" : "Language"}</span>
			</div>

			{options.map((option) => (
				<button
					key={option.value}
					type="button"
					onClick={() => setLanguage(option.value)}
					className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
						language === option.value
							? "bg-blue-600 text-white shadow-sm"
							: "text-slate-600 hover:bg-slate-50"
					}`}
				>
					{option.label}
				</button>
			))}
		</div>
	);
}