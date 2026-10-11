"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  
  // States مربوط به پروفایل (فقط نمایشی)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // States مربوط به تنظیمات (تم و لحن)
  const [tone, setTone] = useState("friendly");
  const [theme, setTheme] = useState("dark");

  // States مربوط به وضعیت بارگذاری و ذخیره تنظیمات
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // خواندن اطلاعات پروفایل و تنظیمات اولیه از دیتابیس
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        // دریافت اطلاعات پروفایل (فقط برای نمایش)
        const profileRes = await fetch("/api/user/profile", { credentials: "include" });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.name) setName(profileData.name);
          if (profileData.email) setEmail(profileData.email);
          if (profileData.phone) setPhone(profileData.phone);
        }

        // دریافت تنظیمات (تم و لحن)
        const settingsRes = await fetch("/api/user/settings", { credentials: "include" });
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          if (settingsData.tone) {
            setTone(settingsData.tone);
            localStorage.setItem("nava_tone", settingsData.tone);
          }
          if (settingsData.theme) {
            setTheme(settingsData.theme);
            localStorage.setItem("nava_theme", settingsData.theme);
          }
        }
      } catch (err) {
        console.error("Failed to load data from DB", err);
        // Fallback تنظیمات به localStorage در صورت بروز خطا
        const savedTone = localStorage.getItem("nava_tone");
        const savedTheme = localStorage.getItem("nava_theme");
        if (savedTone) setTone(savedTone);
        if (savedTheme) setTheme(savedTheme);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // ذخیره فقط تنظیمات (تم و لحن)
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedMessage(false);
    setErrorMessage("");

    try {
      // ۱. ذخیره در localStorage برای دسترسی سریع فرانت‌اند
      localStorage.setItem("nava_tone", tone);
      localStorage.setItem("nava_theme", theme);

      // ۲. ذخیره تنظیمات (تم و لحن) در دیتابیس
      const settingsRes = await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tone, theme }),
      });

      if (!settingsRes.ok) {
        const errorData = await settingsRes.json();
        throw new Error(errorData.error || "خطا در ذخیره تنظیمات");
      }

      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } catch (error: any) {
      console.error("Failed to save:", error);
      setErrorMessage(error.message || "خطایی در ذخیره تنظیمات رخ داد.");
    } finally {
      setIsSaving(false);
    }
  };

  const isDark = theme === "dark";

  if (isLoading) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 font-sans">
        <p className="text-xs animate-pulse">در حال بارگذاری اطلاعات...</p>
      </div>
    );
  }

  return (
    <div dir="rtl" className={`min-h-screen p-6 font-sans flex flex-col ${isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"}`}>
      <div className="max-w-xl mx-auto w-full space-y-6">
        
        {/* هدر تنظیمات */}
        <div className={`flex items-center justify-between pb-4 border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">⚙️</span>
            <h1 className="text-sm font-bold">تنظیمات و شخصی‌سازی نوا</h1>
          </div>
          <button
            onClick={() => router.push("/chat")}
            className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${isDark ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"}`}
          >
            ← بازگشت به گفتگو
          </button>
        </div>

        <div className="space-y-6">

          {/* بخش اطلاعات پروفایل (فقط نمایشی + لینک تکمیل پروفایل) */}
          <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} space-y-4`}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-xs text-teal-500">مشخصات حساب کاربری</h2>
              <span className="text-[10px] text-slate-400">اطلاعات ثبت‌شده</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* شماره موبایل */}
              <div className={`p-3 rounded-xl border ${isDark ? "bg-slate-950 border-slate-800/80" : "bg-slate-50 border-slate-200"}`}>
                <span className="block text-[10px] text-slate-400 mb-1">شماره موبایل</span>
                <span className="text-xs font-medium">{phone || "ثبت نشده"}</span>
              </div>

              {/* نام کاربر */}
              <div className={`p-3 rounded-xl border ${isDark ? "bg-slate-950 border-slate-800/80" : "bg-slate-50 border-slate-200"}`}>
                <span className="block text-[10px] text-slate-400 mb-1">نام و نام خانوادگی</span>
                <span className="text-xs font-medium">{name || "ثبت نشده"}</span>
              </div>

              {/* ایمیل کاربر */}
              <div className={`p-3 rounded-xl border ${isDark ? "bg-slate-950 border-slate-800/80" : "bg-slate-50 border-slate-200"}`}>
                <span className="block text-[10px] text-slate-400 mb-1">ایمیل</span>
                <span className="text-xs font-medium">{email || "ثبت نشده"}</span>
              </div>
            </div>

            {/* لینک به صفحه تکمیل پروفایل */}
            <div className={`pt-3 border-t flex items-center justify-between text-xs ${isDark ? "border-slate-800" : "border-slate-100"}`}>
              <span className="text-slate-400 text-[11px]">نیاز به ویرایش یا تکمیل اطلاعات دارید؟</span>
              <button
                type="button"
                onClick={() => router.push("/profile")} // مسیر صفحه تکمیل پروفایل خود را اینجا تنظیم کنید
                className="text-teal-500 hover:text-teal-400 font-medium transition-colors flex items-center gap-1"
              >
                تکمیل یا ویرایش پروفایل ←
              </button>
            </div>
          </div>
          
          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* بخش انتخاب تم */}
            <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} space-y-3`}>
              <h2 className="font-bold text-xs text-teal-500">حالت نمایش (تم)</h2>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${theme === 'dark' ? 'border-teal-500 bg-teal-500/10 font-bold' : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    checked={theme === 'dark'}
                    onChange={(e) => setTheme(e.target.value as "dark" | "light")}
                    className="accent-teal-500"
                  />
                  <span className="text-xs">🌙 تم تاریک (Dark)</span>
                </label>

                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${theme === 'light' ? 'border-teal-500 bg-teal-500/10 font-bold' : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    checked={theme === 'light'}
                    onChange={(e) => setTheme(e.target.value as "dark" | "light")}
                    className="accent-teal-500"
                  />
                  <span className="text-xs">☀️ تم روشن (Light)</span>
                </label>
              </div>
            </div>

            {/* بخش انتخاب لحن پاسخگویی */}
            <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} space-y-3`}>
              <h2 className="font-bold text-xs text-teal-500">لحن و حال و هوای پاسخگویی «نوا»</h2>
              <p className="text-[11px] text-slate-400">مشخص کنید «نوا» چطور با شما صحبت کند:</p>

              <div className="space-y-2 pt-1">
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${tone === 'friendly' ? 'border-teal-500 bg-teal-500/10' : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                  <input
                    type="radio"
                    name="tone"
                    value="friendly"
                    checked={tone === 'friendly'}
                    onChange={(e) => setTone(e.target.value)}
                    className="accent-teal-500"
                  />
                  <div>
                    <div className="font-bold text-xs">صمیمی و همدلانه (پیش‌فرض)</div>
                    <div className="text-[10px] opacity-75">گرم، پر از آرامش، مأمن امن ذهن و دوستانه</div>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${tone === 'formal' ? 'border-teal-500 bg-teal-500/10' : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                  <input
                    type="radio"
                    name="tone"
                    value="formal"
                    checked={tone === 'formal'}
                    onChange={(e) => setTone(e.target.value)}
                    className="accent-teal-500"
                  />
                  <div>
                    <div className="font-bold text-xs">رسمی و حرفه‌ای</div>
                    <div className="text-[10px] opacity-75">دقیق، ساختاریافته و کاملاً رسمی</div>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${tone === 'concise' ? 'border-teal-500 bg-teal-500/10' : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                  <input
                    type="radio"
                    name="tone"
                    value="concise"
                    checked={tone === 'concise'}
                    onChange={(e) => setTone(e.target.value)}
                    className="accent-teal-500"
                  />
                  <div>
                    <div className="font-bold text-xs">کوتاه و مستقیم</div>
                    <div className="text-[10px] opacity-75">مقتصد، بدون حاشیه و مستقیم سر اصل مطلب</div>
                  </div>
                </label>
              </div>
            </div>

            {/* پیام‌های خطا یا موفقیت و دکمه ذخیره تنظیمات */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-2 gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs px-6 py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-teal-600/20 disabled:opacity-50"
              >
                {isSaving ? "در حال ذخیره..." : "ذخیره تنظیمات"}
              </button>

              {savedMessage && (
                <span className="text-xs text-teal-400 font-medium animate-pulse">
                  ✅ تنظیمات با موفقیت ذخیره شد!
                </span>
              )}

              {errorMessage && (
                <span className="text-xs text-red-400 font-medium">
                  ❌ {errorMessage}
                </span>
              )}
            </div>
          </form>

        </div>

      </div>
    </div>
  );
}