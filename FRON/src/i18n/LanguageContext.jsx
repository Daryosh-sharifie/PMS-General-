import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translations } from "./translations";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
	const [language, setLanguage] = useState(() => {
		return localStorage.getItem("app_language") || "fa";
	});

	useEffect(() => {
		localStorage.setItem("app_language", language);

		document.documentElement.lang = language;
		document.documentElement.dir = language === "fa" ? "rtl" : "ltr";
	}, [language]);

	const value = useMemo(() => {
		const t = (key) => {
			return translations[language]?.[key] || translations.en[key] || key;
		};

		return {
			language,
			setLanguage,
			t,
			isRtl: language === "fa",
		};
	}, [language]);

	return (
		<LanguageContext.Provider value={value}>
			{children}
		</LanguageContext.Provider>
	);
}

export function useLanguage() {
	const context = useContext(LanguageContext);

	if (!context) {
		throw new Error("useLanguage must be used inside LanguageProvider");
	}
	return context;
}
