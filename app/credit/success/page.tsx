"use client";

import Link from "next/link";

export default function PaymentSuccessPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-slate-900 text-slate-100 font-sans flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800/80 border border-slate-700 rounded-3xl p-8 text-center shadow-2xl space-y-6">
        
        {/* آیکون موفقیت */}
        <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl">
          ✓
        </div>

        {/* متن‌ها */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white">پرداخت با موفقیت انجام شد!</h1>
          <p className="text-sm text-slate-400">
            اشتراک نامحدود شما فعال شد و هم‌اکنون می‌توانید بدون محدودیت با نوا گفتگو کنید.
          </p>
        </div>

        {/* دکمه‌ها */}
        <div className="flex flex-col gap-3 pt-4">
          <Link
            href="/chat"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 px-4 rounded-2xl transition-all text-center"
          >
            ورود به صفحه گفتگو (چت)
          </Link>
          <Link
            href="/credit"
            className="w-full bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium py-3 px-4 rounded-2xl transition-all text-center text-xs"
          >
            مشاهده تاریخچه خریدها
          </Link>
        </div>

      </div>
    </div>
  );
}