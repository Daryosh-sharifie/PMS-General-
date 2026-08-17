import { useState, useEffect, useCallback } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";

export default function FullScreenButton({ showLabel = false, className = "", variant = "default" }) {
	const { t, language } = useLanguage();
	const isRtl = language === "fa";
	const [isFullscreen, setIsFullscreen] = useState(false);

	const checkFullscreen = useCallback(() => {
		const fsElement =
			document.fullscreenElement ||
			document.webkitFullscreenElement ||
			document.mozFullScreenElement ||
			document.msFullscreenElement;
		setIsFullscreen(!!fsElement);
	}, []);

	useEffect(() => {
		checkFullscreen();

		const events = [
			"fullscreenchange",
			"webkitfullscreenchange",
			"mozfullscreenchange",
			"MSFullscreenChange",
		];

		events.forEach((event) => {
			document.addEventListener(event, checkFullscreen);
		});

		return () => {
			events.forEach((event) => {
				document.removeEventListener(event, checkFullscreen);
			});
		};
	}, [checkFullscreen]);

	const toggleFullscreen = async () => {
		try {
			if (!isFullscreen) {
				const docEl = document.documentElement;
				if (docEl.requestFullscreen) {
					await docEl.requestFullscreen();
				} else if (docEl.webkitRequestFullscreen) {
					await docEl.webkitRequestFullscreen();
				} else if (docEl.mozRequestFullScreen) {
					await docEl.mozRequestFullScreen();
				} else if (docEl.msRequestFullscreen) {
					await docEl.msRequestFullscreen();
				}
			} else {
				if (document.exitFullscreen) {
					await document.exitFullscreen();
				} else if (document.webkitExitFullscreen) {
					await document.webkitExitFullscreen();
				} else if (document.mozCancelFullScreen) {
					await document.mozCancelFullScreen();
				} else if (document.msExitFullscreen) {
					await document.msExitFullscreen();
				}
			}
		} catch (err) {
			console.error("Error toggling fullscreen mode:", err);
		}
	};

	const label = isFullscreen ? t("exitFullScreen") || "Exit Fullscreen" : t("fullScreen") || "Fullscreen";
	const Icon = isFullscreen ? Minimize2 : Maximize2;

	let baseStyles =
		"inline-flex items-center justify-center gap-2 rounded-2xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 active:scale-95 group";

	if (variant === "compact") {
		baseStyles += isFullscreen
			? " border-blue-200 bg-blue-50 p-2 text-blue-700 hover:bg-blue-100/70 shadow-xs"
			: " border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm";
	} else if (variant === "sidebar") {
		baseStyles =
			"flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-200 active:scale-95 group " +
			(isFullscreen
				? "bg-blue-50 text-blue-700 shadow-xs"
				: "text-slate-600 hover:bg-slate-50 hover:text-slate-950");
	} else {
		// Default header style
		baseStyles += isFullscreen
			? " border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 shadow-xs hover:bg-blue-100/70 sm:px-4 sm:text-sm"
			: " border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 sm:px-4 sm:text-sm";
	}

	return (
		<button
			type="button"
			onClick={toggleFullscreen}
			className={`${baseStyles} ${className}`}
			title={`${label} (F11)`}
			aria-label={label}
		>
			<Icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
			{showLabel && (
				<span className="min-w-0 truncate font-semibold">
					{label}
				</span>
			)}
		</button>
	);
}
