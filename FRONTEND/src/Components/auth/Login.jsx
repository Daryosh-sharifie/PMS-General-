import { Hospital } from "lucide-react";
import { Card, CardHeader, CardContent } from "../ui/Card";
import { labelClasses, buttonPrimary } from "../../constants/styles";
import { useState } from "react";
import useStore from "../../store/useStore.jsx";
import { useNavigate } from "react-router-dom";

export default function Login({ hospitalSettings }) {
	const navigate = useNavigate();
	const { login, authLoading, authError } = useStore();
	const [loginForm, setLoginForm] = useState({ email: "", password: "", error: null });
	const hospitalName = hospitalSettings?.name || "شفاخانه علی سینا";
	const logoSrc = hospitalSettings?.logoPreview;

	const handleLogin = async (e) => {
		e.preventDefault();
		try {
			setLoginForm({ ...loginForm, error: null });
			await login(loginForm.email, loginForm.password);
			navigate("/dashboard");
		} catch (error) {
			const errorMessage = error.message || 'ورود ناموفق بود';
			setLoginForm({ ...loginForm, error: errorMessage });
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-tr from-blue-100 via-white to-blue-200 p-4"
			dir="rtl">
			<Card className="w-full max-w-md p-2 pb-6 shadow-xl">
				<CardHeader className="text-center">
					<div className=" flex justify-center">
						{logoSrc ? (
							<div className="h-20 w-20 overflow-hidden rounded-full border border-gray-100 bg-white p-2 shadow-sm">
								<img src={logoSrc} alt="Hospital Logo" className="h-full w-full object-contain" />
							</div>
						) : (
							<div className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 p-3">
								<Hospital className="h-8 w-8 text-white" />
							</div>
						)}
					</div>
					<div className="mt-4 flex flex-col items-center space-y-2">
						<h2 className="text-2xl font-bold text-gray-900">به سیستم نسخه دیجیتالی {hospitalName} خوش آمدید!</h2>
						<p className="text-[12px] text-gray-600 w-[300px]">برای ورود به سیستم، لطفاً اطلاعات ذیل را تکمیل نمائید.</p>
					</div>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleLogin} className="space-y-4 font-medium">
						<div className="space-y-2">
							<label className={labelClasses} htmlFor="email">
								نام کاربر
							</label>
							<input
								id="email"
								type="email"
								dir="ltr"
								style={{ textAlign: "left", direction: "ltr" }}
								className="w-full font-sans rounded-lg text-left border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
								placeholder="email@example.com"
								value={loginForm.email}
								onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value, error: null })}
								required
								disabled={authLoading}
							/>
						</div>
						<div className="space-y-2">
							<label className={labelClasses} htmlFor="password">
								رمز عبور
							</label>
							<input
								id="password"
								type="password"
								dir="ltr"
								style={{ textAlign: "left", direction: "ltr" }}
								className="w-full font-sans rounded-lg text-left border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
								placeholder="••••••••"
								value={loginForm.password}
								onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value, error: null })}
								required
								disabled={authLoading}
							/>
						</div>
						{(loginForm.error || authError) && (
							<div className="rounded-lg bg-red-50 border border-red-200 p-3">
								<p className="text-sm text-red-700 text-center font-medium">
									❌ {loginForm.error || authError}
								</p>
							</div>
						)}
						<button
							type="submit"
							className={buttonPrimary + " mt-10 w-full bg-blue-600 hover:from-blue-700 hover:bg-blue-500 focus:ring-blue-500"}
							disabled={authLoading}
						>
							{authLoading ? "...Loading" : "Login"}
						</button>
					</form>
					{/* Provide by spark trust */}
					<div className="mt-6 flex justify-center">

						<p className="text-xs text-gray-500 border-t border-gray-300 pt-4 w-full text-center">ارائه شده توسط: <span></span>
							<a href="https://sparktrust.tech" target="_blank" rel="noopener noreferrer" className="text-blue-600 pr-2 font-medium hover:underline">
								Spark Trust Technlogy Service</a></p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

