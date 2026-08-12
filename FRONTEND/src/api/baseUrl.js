/** API base — empty string = relative URLs (same host as the page, works for LAN via Vite proxy). */
export const getApiOrigin = () => {
	const configured = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
	if (configured) return configured;
	return "";
};

export const getSocketOrigin = () => {
	const configured = import.meta.env.VITE_SOCKET_URL?.replace(/\/$/, "");
	if (configured) return configured;
	if (typeof window !== "undefined") return window.location.origin;
	return "";
};
