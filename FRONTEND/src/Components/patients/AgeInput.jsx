import {
	toEnglishDigits,
	toPersianDigits,
	AGE_UNIT_OPTIONS,
} from "../../utils/helpers";
import { useLanguage } from "../../i18n/LanguageContext";

const AGE_UNIT_TRANSLATION_KEYS = {
	year: "years",
	month: "months",
	week: "weeks",
	day: "days",
};

export default function AgeInput({
	value,
	unit,
	onChange,
	inputClassName = "",
	required = false,
}) {
	const { t, language } = useLanguage();

	const displayValue = language === "fa" ? toPersianDigits(value) : value;

	return (
		<div className="grid grid-cols-2 gap-2">
			<input
				type="text"
				inputMode="decimal"
				className={inputClassName}
				value={displayValue || ""}
				onChange={(e) => {
					const nextValue = toEnglishDigits(e.target.value).replace(/[^\d.]/g, "");
					onChange(nextValue, unit);
				}}
				required={required}
				placeholder={t("ageValuePlaceholder")}
			/>

			<select
				className={inputClassName}
				value={unit || "year"}
				onChange={(e) => onChange(value, e.target.value)}
				required={required}
			>
				{AGE_UNIT_OPTIONS.map((opt) => (
					<option key={opt.value} value={opt.value}>
						{t(AGE_UNIT_TRANSLATION_KEYS[opt.value])}
					</option>
				))}
			</select>
		</div>
	);
}