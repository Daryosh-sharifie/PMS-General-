import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Plus,
	Eye,
	Pencil,
	Trash2,
	ChevronLeft,
	ChevronRight,
	Search,
	Users,
	ShieldCheck,
} from "lucide-react";
import { Card, CardContent } from "../ui/Card";
import Badge from "../ui/Badge";
import { inputClasses, buttonPrimary, buttonGhost } from "../../constants/styles";
import { useLanguage } from "../../i18n/LanguageContext";

const ITEMS_PER_PAGE = 20;

function getRoleKey(role) {
	const value = String(role || "").toLowerCase();

	const map = {
		admin: "admin",
		doctor: "doctor",
		pharmacist: "pharmacist",
		reciption: "reception",
		reception: "reception",
		labstaff: "labStaff",
	};

	return map[value] || value || "notAssigned";
}

function roleBadgeClass(role) {
	const value = String(role || "").toLowerCase();

	const classes = {
		admin: "border-red-100 bg-red-50 text-red-700",
		doctor: "border-blue-100 bg-blue-50 text-blue-700",
		pharmacist: "border-purple-100 bg-purple-50 text-purple-700",
		reciption: "border-emerald-100 bg-emerald-50 text-emerald-700",
		reception: "border-emerald-100 bg-emerald-50 text-emerald-700",
		labstaff: "border-indigo-100 bg-indigo-50 text-indigo-700",
	};

	return classes[value] || "border-slate-200 bg-slate-50 text-slate-700";
}

export default function UserList({ users = [], onRemoveUser, onRefetch }) {
	const navigate = useNavigate();
	const { t, language } = useLanguage();

	const [currentPage, setCurrentPage] = useState(1);
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [deleteConfirm, setDeleteConfirm] = useState(null);

	const adminCount = useMemo(
		() => users.filter((user) => getRoleKey(user.role) === "admin").length,
		[users]
	);

	const filteredUsers = useMemo(() => {
		const term = search.trim().toLowerCase();

		return users
			.filter((user) => {
				if (!term) return true;

				return (
					String(user.name || "").toLowerCase().includes(term) ||
					String(user.email || "").toLowerCase().includes(term) ||
					String(user.phone || "").toLowerCase().includes(term) ||
					t(getRoleKey(user.role)).toLowerCase().includes(term)
				);
			})
			.slice()
			.reverse();
	}, [users, search, t]);

	const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
	const start = (currentPage - 1) * ITEMS_PER_PAGE;
	const currentUsers = filteredUsers.slice(start, start + ITEMS_PER_PAGE);

	const doctorCount = users.filter((user) => getRoleKey(user.role) === "doctor").length;

	const goToPage = (page) => {
		setCurrentPage(Math.max(1, Math.min(page, totalPages)));
	};

	const handleSearchChange = (value) => {
		setSearch(value);
		setCurrentPage(1);
	};

	const handleDelete = async () => {
		if (!deleteConfirm) return;

		try {
			setLoading(true);
			setError("");
			setSuccess("");

			await onRemoveUser(deleteConfirm.id);

			setSuccess(t("userDeletedSuccessfully"));
			setDeleteConfirm(null);

			if (onRefetch) await onRefetch();

			setTimeout(() => setSuccess(""), 3000);
		} catch (err) {
			setError(err.message || t("failedToDeleteUser"));
			setDeleteConfirm(null);
			setTimeout(() => setError(""), 4000);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="space-y-6 p-4 md:p-6">
			<DeleteModal
				open={Boolean(deleteConfirm)}
				user={deleteConfirm}
				onCancel={() => setDeleteConfirm(null)}
				onConfirm={handleDelete}
				loading={loading}
				t={t}
			/>

			<div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div className="flex items-center justify-end gap-3 text-right">
						<div>
							<h2 className="text-3xl font-bold text-slate-950">{t("users")}</h2>
							<p className="mt-1 text-sm text-slate-500">
								{t("total")}:{" "}
								{users.length.toLocaleString(language === "fa" ? "fa-IR" : "en-US")}{" "}
								{t("usersCount")} • {t("doctors")}:{" "}
								{doctorCount.toLocaleString(language === "fa" ? "fa-IR" : "en-US")}
							</p>
						</div>

						<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
							<Users className="h-6 w-6" />
						</div>
					</div>
					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							className={buttonPrimary}
							onClick={() => navigate("/users/add")}
							disabled={loading}
						>
							<Plus className="mr-2 h-4 w-4" />
							{t("addUser")}
						</button>
					</div>

				</div>
			</div>

			{error && (
				<div className="rounded-xl border border-red-200 bg-red-50 p-3 text-right text-sm font-semibold text-red-700">
					{error}
				</div>
			)}

			{success && (
				<div className="rounded-xl border border-green-200 bg-green-50 p-3 text-right text-sm font-semibold text-green-700">
					{success}
				</div>
			)}

			<Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
				<CardContent className="p-4">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
						<input
							className={`${inputClasses} pl-10 text-right`}
							placeholder={t("searchUsersPlaceholder")}
							value={search}
							onChange={(event) => handleSearchChange(event.target.value)}
						/>
					</div>
				</CardContent>
			</Card>

			<Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
				<CardContent className="p-0">
					{currentUsers.length === 0 ? (
						<div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
							<div className="mb-3 rounded-2xl bg-slate-50 p-4 text-slate-400">
								<Users className="h-8 w-8" />
							</div>
							<p className="font-bold text-slate-700">{t("noUsersFound")}</p>
							<p className="mt-1 text-sm text-slate-500">
								{t("tryChangingSearch")}
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="min-w-full">
								<thead className="border-b border-slate-200 bg-slate-50">
									<tr>
										<Th>{t("actions")}</Th>
										<Th>{t("role")}</Th>
										<Th>{t("phone")}</Th>
										<Th>{t("email")}</Th>
										<Th align="right">{t("name")}</Th>
										<Th>#</Th>
									</tr>
								</thead>

								<tbody className="divide-y divide-slate-100">
									{currentUsers.map((user, index) => {
										const roleKey = getRoleKey(user.role);
										const isAdmin = roleKey === "admin";
										const isOnlyAdmin = isAdmin && adminCount <= 1;

										return (
											<tr key={user.id} className="transition hover:bg-slate-50">
												<td className="px-4 py-4 text-center">
													<div className="flex items-center justify-center gap-1">

														<button
															type="button"
															className={`${buttonGhost} px-2 py-1`}
															title={t("editUser")}
															onClick={() => navigate(`/users/edit/${user.id}`)}
														>
															<Pencil className="h-4 w-4" />
														</button>

														<button
															type="button"
															className={`${buttonGhost} px-2 py-1 ${
																isOnlyAdmin
																	? "cursor-not-allowed opacity-50"
																	: "hover:text-red-600"
															}`}
															title={
																isOnlyAdmin
																	? t("cannotDeleteOnlyAdmin")
																	: t("deleteUser")
															}
															onClick={() => {
																if (!isOnlyAdmin) setDeleteConfirm(user);
															}}
															disabled={isOnlyAdmin || loading}
														>
															<Trash2 className="h-4 w-4" />
														</button>
													</div>
												</td>

												<td className="px-4 py-4 text-center">
													<Badge className={roleBadgeClass(user.role)}>
														<ShieldCheck className="mr-1 h-3 w-3" />
														{t(roleKey)}
													</Badge>
												</td>

												<td className="px-4 py-4 text-center text-slate-700">
													{user.phone || "-"}
												</td>

												<td className="px-4 py-4 text-center text-slate-700">
													{user.email || "-"}
												</td>

												<td className="px-4 py-4 text-right font-semibold text-slate-900">
													{user.name || "-"}
												</td>

												<td className="px-4 py-4 text-center text-sm text-slate-500">
													{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>

			<Pagination
				currentPage={currentPage}
				totalPages={totalPages}
				goToPage={goToPage}
			/>
		</div>
	);
}

function Th({ children, align = "center" }) {
	return (
		<th
			className={`px-4 py-3 text-${align} text-xs font-bold uppercase tracking-wide text-slate-500`}
		>
			{children}
		</th>
	);
}

function Pagination({ currentPage, totalPages, goToPage }) {
	if (totalPages <= 1) return null;

	const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
		(page) =>
			page === 1 ||
			page === totalPages ||
			(page >= currentPage - 1 && page <= currentPage + 1)
	);

	return (
		<div className="flex items-center justify-center gap-2">
			<button
				type="button"
				onClick={() => goToPage(currentPage - 1)}
				disabled={currentPage === 1}
				className="rounded-lg border border-slate-300 p-2 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
			>
				<ChevronLeft className="h-4 w-4" />
			</button>

			<div className="flex items-center gap-1">
				{pages.map((page, index) => {
					const previous = pages[index - 1];
					const showDots = previous && page - previous > 1;

					return (
						<span key={page} className="flex items-center gap-1">
							{showDots && <span className="px-2 text-slate-400">...</span>}
							<button
								type="button"
								onClick={() => goToPage(page)}
								className={`min-w-[2rem] rounded-lg px-3 py-1 text-sm font-semibold ${
									currentPage === page
										? "bg-blue-600 text-white"
										: "border border-slate-300 text-slate-700 hover:bg-slate-50"
								}`}
							>
								{page}
							</button>
						</span>
					);
				})}
			</div>

			<button
				type="button"
				onClick={() => goToPage(currentPage + 1)}
				disabled={currentPage === totalPages}
				className="rounded-lg border border-slate-300 p-2 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
			>
				<ChevronRight className="h-4 w-4" />
			</button>
		</div>
	);
}

function DeleteModal({ open, user, onCancel, onConfirm, loading, t }) {
	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
			<div className="w-full max-w-sm rounded-2xl bg-white p-6 text-right shadow-2xl" dir="rtl">
				<h3 className="text-lg font-bold text-slate-950">{t("deleteUser")}</h3>
				<p className="mt-2 text-sm text-slate-500">
					{t("deleteUserConfirm")}{" "}
					<span className="font-bold text-slate-900">{user?.name}</span>
				</p>

				<div className="mt-6 flex justify-start gap-3">
					<button
						type="button"
						onClick={onConfirm}
						disabled={loading}
						className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{loading ? t("processing") : t("yesDelete")}
					</button>

					<button
						type="button"
						onClick={onCancel}
						disabled={loading}
						className="rounded-lg bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
					>
						{t("cancel")}
					</button>
				</div>
			</div>
		</div>
	);
}