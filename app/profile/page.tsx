"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [tone, setTone] = useState("friendly");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/user/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setName(data.name || "");
          setPhone(data.phone || "");
          setEmail(data.email || "");
          setTone(data.tone || "friendly");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("خطا در دریافت اطلاعات پروفایل.");
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, tone }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("تغییرات با موفقیت ذخیره شد.");
      } else {
        setError(data.error || "خطا در ذخیره اطلاعات.");
      }
    } catch {
      setError("خطا در ارتباط با سرور.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400 text-sm">
        در حال بارگذاری پروفایل...
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
        
        {/* هدر صفحه و دکمه بازگشت */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-xl font-bold text-slate-100">پروفایل کاربری</h1>
            <p className="text-xs text-slate-400 mt-1">مدیریت اطلاعات حساب و تنظیمات شخصی</p>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-teal-400 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span>بازگشت به داشبورد</span>
          </Link>
        </div>

        {message && (
          <div className="mb-6 p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs text-center">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* شماره موبایل (غیرقابل تغییر) */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">شماره موبایل</label>
            <input
              type="text"
              value={phone}
              disabled
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-500 cursor-not-allowed font-mono"
              dir="ltr"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">شماره موبایل به عنوان شناسه اصلی قابل تغییر نیست.</span>
          </div>

          {/* نام و نام خانوادگی */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">نام و نام خانوادگی</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="نام خود را وارد کنید"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-100 outline-none focus:border-teal-500 transition-all"
            />
          </div>

          {/* ایمیل */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">ایمیل</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@site.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-100 outline-none focus:border-teal-500 transition-all text-left"
              dir="ltr"
            />
          </div>

          {/* لحن پیش‌فرض هوش مصنوعی */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">لحن پیش‌فرض پاسخ‌گویی نوا</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-100 outline-none focus:border-teal-500 transition-all"
            >
              <option value="friendly">صمیمانه و مهربان</option>
              <option value="formal">رسمی و محترمانه</option>
              <option value="professional">حرفه‌ای و تخصصی</option>
              <option value="concise">کوتاه و صریح</option>
            </select>
          </div>

          {/* دکمه ذخیره */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50 cursor-pointer text-sm mt-4"
          >
            {saving ? "در حال ذخیره تغییرات..." : "ذخیره تغییرات پروفایل"}
          </button>
        </form>
      </div>
    </div>
  );
}