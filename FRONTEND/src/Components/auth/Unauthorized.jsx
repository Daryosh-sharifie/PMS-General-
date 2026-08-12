export default function Unauthorized() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="text-lg font-semibold">دسترسی غیرمجاز</p>
        <p className="text-sm">شما اجازه دسترسی به این صفحه را ندارید.</p>
      </div>
    </div>
  );
}

