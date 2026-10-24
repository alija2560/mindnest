import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d1117] text-white p-4">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-bold">گزارش مورد نظر پیدا نشد</h2>
        <Link 
          href="/admin/reports" 
          className="inline-block px-4 py-2 bg-emerald-600 rounded-xl text-sm"
        >
          بازگشت به لیست گزارش‌ها
        </Link>
      </div>
    </div>
  );
}