import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d1117] px-4">
      <div className="w-full max-w-md p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-center space-y-4">
        <div className="w-12 h-12 mx-auto flex items-center justify-center rounded-full bg-amber-500/10 text-amber-500 font-bold text-xl">
          🔍
        </div>
        
        <h3 className="text-xl font-bold text-slate-100">
          صفحه مورد نظر پیدا نشد
        </h3>
        
        <p className="text-sm text-slate-400">
          مسیری که به دنبال آن هستید وجود ندارد یا به آدرس دیگری منتقل شده است.
        </p>

        <div className="pt-2">
          <Link
            href="/auth"
            className="inline-block w-full px-4 py-2.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition shadow-lg shadow-emerald-600/20 text-center"
          >
            بازگشت به صفحه ورود
          </Link>
        </div>
      </div>
    </div>
  );
}