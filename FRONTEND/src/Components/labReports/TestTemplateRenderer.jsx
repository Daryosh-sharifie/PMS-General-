export default function TestTemplateRenderer({
	templateSnapshot = [],
	manualResults = {},
	onChange,
	disabled = false,
}) {
	const fields = Array.isArray(templateSnapshot) ? templateSnapshot : [];

	if (fields.length === 0) {
		return (
			<div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
				No structured template fields were provided for this test.
			</div>
		);
	}

	const updateValue = (key, value) => {
		onChange({ ...manualResults, [key]: value });
	};

	return (
		<div className="grid gap-4 md:grid-cols-2">
			{fields.map((field, index) => {
				const key = field.key || field.name || `field-${index}`;
				const type = String(field.type || field.inputType || "text").toLowerCase();
				const label = field.label || field.name || key;
				const unit = field.unit || field.units || "";
				const normalRange = field.normalRange || field.referenceRange || "";
				const required = Boolean(field.required);
				const isBooleanField = type === "checkbox" || type === "boolean";
				const value = manualResults[key] ?? field.defaultValue ?? (isBooleanField ? false : "");
				const options = Array.isArray(field.options)
					? field.options
					: Array.isArray(field.values)
						? field.values
						: [];

				return (
					<div key={key} className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
						<div className="mb-2 flex items-start justify-between gap-2">
							<div>
								<label className="block text-sm font-semibold text-slate-800">{label}</label>
								{normalRange && <p className="text-[10px] text-slate-500">Normal: {normalRange}</p>}
							</div>
							{required && <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">Required</span>}
						</div>

						{type === "textarea" && (
							<textarea
								disabled={disabled}
								value={value}
								onChange={(e) => updateValue(key, e.target.value)}
								className="min-h-[88px] w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm outline-none focus:border-blue-400 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
							/>
						)}

						{type === "select" && (
							<select
								disabled={disabled}
								value={value}
								onChange={(e) => updateValue(key, e.target.value)}
								className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm outline-none focus:border-blue-400 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
							>
								<option value="">Select</option>
								{options.map((option) => {
									const optionValue = typeof option === "object" ? option.value ?? option.label : option;
									const optionLabel = typeof option === "object" ? option.label ?? option.value : option;
									return (
										<option key={String(optionValue)} value={optionValue}>
											{optionLabel}
										</option>
									);
								})}
							</select>
						)}

						{isBooleanField && (
							<label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm text-slate-700">
								<input
									disabled={disabled}
									type="checkbox"
									checked={Boolean(value)}
									onChange={(e) => updateValue(key, e.target.checked)}
								/>
								<span>{field.checkboxLabel || "Yes / No"}</span>
							</label>
						)}

						{type !== "textarea" && type !== "select" && !isBooleanField && (
							<input
								disabled={disabled}
								type={type === "date" ? "date" : type === "number" ? "number" : "text"}
								value={value}
								onChange={(e) => updateValue(key, e.target.value)}
								className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm outline-none focus:border-blue-400 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
							/>
						)}

						{unit && <p className="mt-2 text-[10px] text-slate-500">Unit: {unit}</p>}
					</div>
				);
			})}
		</div>
	);
}
