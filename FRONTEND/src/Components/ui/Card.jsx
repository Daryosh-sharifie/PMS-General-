export function Card({ children, className = "" }) {
	return <div className={`rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{children}</div>;
}

export function CardHeader({ children, className = "" }) {
	return <div className={`border-b border-gray-100 px-6 py-4 ${className}`}>{children}</div>;
}

export function CardContent({ children, className = "" }) {
	return <div className={`px-6 py-4 ${className}`}>{children}</div>;
}

