"use client";

import { useState } from "react";
import Link from "next/link";
import { NavaLogo } from "@/app/components/NavaLogo";

export default function PricingPage() {
  const [loading, setLoading] = useState(false);

  async function handleBuyCredit() {
    try {
      setLoading(true);
      const res = await fetch("/api/credits/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageType: "standard" }),
      });
      
      const data = await res.json();
      if (res.ok) {
        alert("خرید اعتبار با موفقیت انجام شد! می‌توانید به گفتگو ادامه دهید.");
        window.location.reload(); // رفرش صفحه جهت به‌روزرسانی وضعیت سهمیه
      } else {
        alert(data.error || "خطا در خرید اعتبار");
      }
    } catch (error) {
      alert("خطایی در ارتباط با سرور رخ داد.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#06080d] text-slate-100 font-sans p-4 md:p-8 selection:bg-teal-500 selection:text-slate-950 relative overflow-hidden">
      {/* نورپردازی پس‌زمینه */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-teal-500/10 blur-[140px] pointer-events-none rounded-full"></div>
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[300px] bg-emerald-500/5 blur-[140px] pointer-events-none rounded-full"></div>

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        
        {/* هدر صفحه */}
        <header className="flex items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-2xl border border-slate-800/80 px-6 py-4 rounded-3xl shadow-2xl">
          <div className="flex items-center gap-3.5">
            <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800 shadow-inner">
              <NavaLogo className="w-8 h-8 drop-shadow-md" />
            </div>
            <div>
              <h1 className="font-extrabold text-slate-100 text-sm tracking-wide">
                تعرفه‌ها و اشتراک‌های نوا
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                انتخاب پلن مناسب برای دسترسی به امکانات پیشرفته
              </p>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-teal-400 transition-all shadow-sm"
          >
            بازگشت به داشبورد
          </Link>
        </header>

        {/* بخش اصلی قیمت‌گذاری */}
        <main className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 p-7 rounded-3xl shadow-2xl flex flex-col justify-between space-y-6 relative overflow-hidden group hover:border-teal-500/40 transition-all">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl"></div>
            
            <div className="space-y-3 relative z-10">
              <span className="px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-400 text-[11px] font-semibold">
                پیشنهاد ویژه
              </span>
              <h2 className="text-xl font-black text-slate-100">اشتراک استاندارد ماهانه</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                دسترسی کامل و نامحدود به هوش مصنوعی نوا به مدت ۳۰ روز.
              </p>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="text-2xl font-black text-teal-400 tracking-tight">
                ۱۵۰,۰۰۰ <span className="text-xs font-normal text-slate-400">تومان / ماهانه</span>
              </div>

              <button
                onClick={handleBuyCredit}
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-bold rounded-2xl transition-all shadow-lg shadow-teal-500/20 text-xs disabled:opacity-50 cursor-pointer"
              >
                {loading ? "در حال پردازش..." : "خرید اشتراک استاندارد"}
              </button>
            </div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 p-7 rounded-3xl shadow-2xl flex flex-col justify-between space-y-6 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
            <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
            
            <div className="space-y-3 relative z-10">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-semibold">
                صرفه‌جویی بیشتر
              </span>
              <h2 className="text-xl font-black text-slate-100">اشتراک ۳ ماهه پرو</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                دسترسی ۹۰ روزه به تمام قابلیت‌ها با اولویت پردازش بالا.
              </p>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="text-2xl font-black text-emerald-400 tracking-tight">
                ۴۰۰,۰۰۰ <span className="text-xs font-normal text-slate-400">تومان / ۳ ماهه</span>
              </div>

              <button
                onClick={handleBuyCredit}
                disabled={loading}
                className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-bold rounded-2xl transition-all text-xs disabled:opacity-50 cursor-pointer"
              >
                {loading ? "در حال پردازش..." : "خرید اشتراک ۳ ماهه"}
              </button>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}