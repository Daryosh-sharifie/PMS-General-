import { X } from "lucide-react";

export default function QuickAddPatientModal({
  open,
  onClose,
  quickPatient,
  setQuickPatient,
  addPatientLoading,
  addPatientError,
  onSubmit,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" dir="rtl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-blue-600">اضافه کردن مریض جدید</h2>

          <button type="button" onClick={onClose} className="text-gray-400 hover:text-red-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        {addPatientError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            ❌ {addPatientError}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="نام کامل"
            required
            value={quickPatient.fullname}
            onChange={(value) => setQuickPatient({ ...quickPatient, fullname: value })}
            placeholder="نام مریض"
            autoFocus
          />

          <Input
            label="نام پدر"
            required
            value={quickPatient.fathername}
            onChange={(value) => setQuickPatient({ ...quickPatient, fathername: value })}
            placeholder="نام پدر"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="سن"
              required
              type="number"
              value={quickPatient.age}
              onChange={(value) => setQuickPatient({ ...quickPatient, age: value })}
              placeholder="سن"
            />

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                جنسیت <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                value={quickPatient.gender}
                onChange={(e) =>
                  setQuickPatient({ ...quickPatient, gender: e.target.value })
                }
              >
                <option value="">انتخاب</option>
                <option value="Male">مرد</option>
                <option value="Female">زن</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
              disabled={addPatientLoading}
            >
              لغو
            </button>

            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              disabled={addPatientLoading}
            >
              {addPatientLoading ? "درحال ذخیره..." : "ثبت و انتخاب مریض"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Input({ label, required, value, onChange, placeholder, type = "text", autoFocus }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        required={required}
        autoFocus={autoFocus}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}