'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // خطای فنی را فقط در کنسول مرورگر لاگ می‌کنیم تا به کاربر نمایش داده نشود
    console.error("Application Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d1117] px-4">
      <div className="w-full max-w-md p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-center space-y-4">
        <div className="w-12 h-12 mx-auto flex items-center justify-center rounded-full bg-red-500/10 text-red-500 font-bold text-xl">
          ⚠️
        </div>
        
        <h3 className="text-xl font-bold text-slate-100">
          خطایی در سامانه رخ داده است
        </h3>
        
        <p className="text-sm text-slate-400">
          مشکلی موقت در ارتباط با سرور پیش آمده است. لطفاً دوباره تلاش کنید یا به صفحه ورود بازگردید.
        </p>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 px-4 py-2.5 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
          >
            تلاش مجدد
          </button>
          
          <button
            onClick={() => router.replace('/auth')}
            className="flex-1 px-4 py-2.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition shadow-lg shadow-emerald-600/20"
          >
            صفحه ورود
          </button>
        </div>
      </div>
    </div>
  );
}