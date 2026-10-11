"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { dictionary, Lang } from "@/lib/dictionary";

export default function AdminUserManagePage() {
  const router = useRouter();
  const params = useParams();
  const targetUserId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [targetUser, setTargetUser] = useState<any>(null);
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [lang, setLang] = useState<Lang>("fa");

  const [form, setForm] = useState({
    credit: 0,
    messageCount: 0,
    creditExpiresAt: "",
    resetBonus: false,
    isAdmin: false,
    addCredit: 0, // شارژ دستی سهمیه پیام
    customMonthly1Price: "",
    customMonthly3Price: "",
    customMonthly6Price: "",
  });

  useEffect(() => {
    const savedLang = localStorage.getItem("nava_lang") as Lang;
    if (savedLang === "fa" || savedLang === "en") {
      setLang(savedLang);
    }
  }, []);

  const t = (key: keyof typeof dictionary.fa) => {
    return dictionary[lang]?.[key] || dictionary["fa"][key] || key;
  };

  const loadUserData = () => {
    if (!targetUserId) return;

    fetch(`/api/admin/users/${targetUserId}`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          const usr = data.user;
          setTargetUser(usr);
          setGlobalSettings(data.globalSettings);
          
          // مقداردهی دقیق فرم با مقادیر دیتابیس کاربر (اگر سفارشی ثبت شده باشد، دقیقاً همان می‌نشیند)
          setForm((prev) => ({
            ...prev,
            credit: usr.credit ?? 0,
            messageCount: usr.messageCount ?? 0,
            creditExpiresAt: usr.creditExpiresAt
              ? new Date(usr.creditExpiresAt).toISOString().split("T")[0]
              : "",
            isAdmin: usr.isAdmin ?? false,
            customMonthly1Price: usr.customMonthly1Price !== null && usr.customMonthly1Price !== undefined ? usr.customMonthly1Price : "",
            customMonthly3Price: usr.customMonthly3Price !== null && usr.customMonthly3Price !== undefined ? usr.customMonthly3Price : "",
            customMonthly6Price: usr.customMonthly6Price !== null && usr.customMonthly6Price !== undefined ? usr.customMonthly6Price : "",
          }));
        } else {
          setError(data.error || t("userNotFoundText"));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading user:", err);
        setError(t("errorLoadingText"));
        setLoading(false);
      });
  };

  useEffect(() => {
    loadUserData();
  }, [targetUserId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // تابع بازگردانی تعرفه‌ها به حالت پیش‌فرض سایت
  const handleResetToDefaultPricing = (field: 'customMonthly1Price' | 'customMonthly3Price' | 'customMonthly6Price') => {
    setForm({
      ...form,
      [field]: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch(`/api/admin/users/${targetUserId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
        }),
      });

      const result = await res.json();
      if (res.ok) {
        setMessage(t("successSaveText") || "اطلاعات با موفقیت ذخیره شد.");
        loadUserData();
        router.refresh();
      } else {
        setError(result.error || "Error saving information");
      }
    } catch (err) {
      setError("Network error connecting to server");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTransaction = async (txId: string) => {
    const successTransactions = targetUser?.transactions?.filter((tx: any) => tx.status === "SUCCESS") || [];
    const isLastSuccessTx = successTransactions.length <= 1;

    const confirmMessage = isLastSuccessTx
      ? "این آخرین تراکنش موفق کاربر است. با حذف آن، اشتراک کاربر غیرفعال شده و به حالت پایه (رایگان) بازمی‌گردد. آیا مطمئن هستید؟"
      : "با حذف این تراکنش، اگر تراکنش معتبر دیگری وجود داشته باشد سیستم روی آن قرار می‌گیرد، در غیر این صورت به حالت پایه برمی‌گردد. آیا مطمئن هستید؟";

    if (!confirm(confirmMessage)) return;

    try {
      const res = await fetch(`/api/admin/transactions/${txId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("تراکنش با موفقیت حذف شد و وضعیت اشتراک کاربر به‌روزرسانی گردید.");
        loadUserData();
      } else {
        alert(data.error || "خطا در حذف تراکنش");
      }
    } catch (err) {
      console.error(err);
      alert("خطای شبکه در ارتباط با سرور");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center font-sans">
        <p>{t("loadingUserText") || "در حال بارگذاری..."}</p>
      </div>
    );
  }

  if (error && !targetUser) {
    return (
      <div dir={lang === 'fa' ? 'rtl' : 'ltr'} className="min-h-screen bg-slate-900 text-white p-10 text-center font-sans">
        <h1 className="text-xl text-red-400 font-bold">{error}</h1>
        <Link href="/admin/stats" className="inline-block mt-4 text-xs text-teal-400 underline">
          {t("backToSettings") || "بازگشت به پنل مدیریت"}
        </Link>
      </div>
    );
  }

  return (
    <div dir={lang === 'fa' ? 'rtl' : 'ltr'} className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* هدر صفحه */}
        <div className="flex items-center justify-between bg-slate-800/80 p-6 rounded-3xl border border-slate-700/80 shadow-xl backdrop-blur-md">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-extrabold text-white">{t("manageUserPageTitle") || "مدیریت کاربر"}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${targetUser?.isAdmin ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-700 text-slate-300'}`}>
                {targetUser?.isAdmin ? (t("adminUser") || "مدیر") : (t("normalUser") || "کاربر عادی")}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {t("mobileLabel") || "تلفن / شناسه:"} <span className="text-teal-400 font-mono" dir="ltr">{targetUser?.phone || targetUser?.email || "—"}</span>
            </p>
          </div>
          <Link
            href="/admin/stats"
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-700 border border-slate-700 text-xs rounded-xl transition-all shadow-sm"
          >
            {t("backToSettings") || "بازگشت"}
          </Link>
        </div>

        {/* کادر اطلاعات مقایسه‌ای و سهمیه */}
        <div className="bg-teal-500/10 border border-teal-500/20 p-5 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-teal-300">
          <div>
            <span className="block text-slate-400 text-[11px] mb-1">{t("creditBalanceLabel") || "اعتبار فعلی"}</span>
            <span className="font-bold text-base text-white">{targetUser?.credit ?? 0}</span>
          </div>
          <div>
            <span className="block text-slate-400 text-[11px] mb-1">{t("initialGiftLabel") || "هدیه اولیه سایت"}</span>
            <span className="font-bold text-base text-white">{globalSettings?.initialGiftLimit ?? 50}</span>
          </div>
          <div>
            <span className="block text-slate-400 text-[11px] mb-1">{t("giftStatusLabel") || "وضعیت هدیه"}</span>
            <span className={`font-bold text-sm ${targetUser?.hasReceivedFirstBonus ? "text-emerald-400" : "text-amber-400"}`}>
              {targetUser?.hasReceivedFirstBonus ? (t("receivedGiftText") || "دریافت کرده") : (t("notReceivedGiftText") || "دریافت نکرده")}
            </span>
          </div>
        </div>

        {/* فرم ویرایش و تنظیمات اختصاصی قیمت */}
        <form onSubmit={handleSubmit} className="bg-slate-800/50 border border-slate-700/60 p-8 rounded-3xl backdrop-blur-md shadow-lg space-y-6">
          
          {message && (
            <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs text-center font-bold">
              {message}
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-bold">
              {error}
            </div>
          )}

          {/* بخش افزایش دستی پیام */}
          <div className="space-y-3 bg-slate-900/60 p-5 rounded-2xl border border-slate-700/40">
            <h2 className="text-sm font-bold text-teal-400 flex items-center gap-2">
              <span>➕</span> {t("manualCreditTitle") || "افزایش شارژ دستی"}
            </h2>
            <p className="text-[11px] text-slate-400">{t("manualCreditHint") || "مقدار سهمیه جدیدی که می‌خواهید به این کاربر اضافه شود را وارد کنید."}</p>
            <div className="max-w-xs">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">{t("manualCreditLabel") || "مقدار شارژ"}</label>
              <input 
                type="number" 
                name="addCredit" 
                value={form.addCredit} 
                onChange={handleChange}
                placeholder="مثلاً ۵۰ یا ۱۰۰"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-teal-400 font-bold focus:outline-none focus:border-teal-500 text-sm"
              />
            </div>
          </div>

          {/* بخش شخصی‌سازی قیمت پکیج‌ها برای این کاربر به صورت اختصاصی */}
          <div className="space-y-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-700/40">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-teal-400 flex items-center gap-2">
                  <span>💰</span> {t("customPricingTitle") || "تعرفه اختصاصی این کاربر (به تومان)"}
                </h2>
                <p className="text-[11px] text-slate-400 mt-1">
                  اگر مبالغ زیر با مقادیر پیش‌فرض متفاوت باشند، یعنی این کاربر تعرفه سفارشی دارد و در کادر نمایش داده می‌شود.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* بسته ۱ ماهه */}
              <div className="space-y-1.5 bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="text-slate-400">{t("custom1MonthPrice") || "بسته ۱ ماهه"}</span>
                  <span className="text-teal-400/90 font-mono">
                    پیش‌فرض: {globalSettings?.monthly1Price?.toLocaleString('fa-IR') || "۹۹,۰۰۰"} تومان
                  </span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    name="customMonthly1Price"
                    value={form.customMonthly1Price}
                    onChange={handleChange}
                    placeholder="پیش‌فرض سایت"
                    className={`w-full bg-slate-900 border rounded-xl px-3 py-2 text-sm text-white focus:outline-none font-mono ${
                      form.customMonthly1Price !== "" ? "border-amber-500/60 bg-amber-500/5 text-amber-300 font-bold" : "border-slate-700 focus:border-teal-500"
                    }`}
                  />
                  {form.customMonthly1Price !== "" && (
                    <button
                      type="button"
                      onClick={() => handleResetToDefaultPricing('customMonthly1Price')}
                      className="absolute left-2 text-[10px] bg-slate-800 hover:bg-slate-700 text-amber-400 px-2 py-1 rounded-lg border border-slate-600 transition-all"
                      title="بازگشت به پیش‌فرض سایت"
                    >
                      پیش‌فرض
                    </button>
                  )}
                </div>
                {form.customMonthly1Price !== "" && (
                  <span className="block text-[10px] text-amber-400/80 pt-0.5">
                    ✓ تعرفه شخصی‌سازی‌شده ({Number(form.customMonthly1Price).toLocaleString('fa-IR')} تومان)
                  </span>
                )}
              </div>

              {/* بسته ۳ ماهه */}
              <div className="space-y-1.5 bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="text-slate-400">{t("custom3MonthsPrice") || "بسته ۳ ماهه"}</span>
                  <span className="text-teal-400/90 font-mono">
                    پیش‌فرض: {globalSettings?.monthly3Price?.toLocaleString('fa-IR') || "۲۴۹,۰۰۰"} تومان
                  </span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    name="customMonthly3Price"
                    value={form.customMonthly3Price}
                    onChange={handleChange}
                    placeholder="پیش‌فرض سایت"
                    className={`w-full bg-slate-900 border rounded-xl px-3 py-2 text-sm text-white focus:outline-none font-mono ${
                      form.customMonthly3Price !== "" ? "border-amber-500/60 bg-amber-500/5 text-amber-300 font-bold" : "border-slate-700 focus:border-teal-500"
                    }`}
                  />
                  {form.customMonthly3Price !== "" && (
                    <button
                      type="button"
                      onClick={() => handleResetToDefaultPricing('customMonthly3Price')}
                      className="absolute left-2 text-[10px] bg-slate-800 hover:bg-slate-700 text-amber-400 px-2 py-1 rounded-lg border border-slate-600 transition-all"
                      title="بازگشت به پیش‌فرض سایت"
                    >
                      پیش‌فرض
                    </button>
                  )}
                </div>
                {form.customMonthly3Price !== "" && (
                  <span className="block text-[10px] text-amber-400/80 pt-0.5">
                    ✓ تعرفه شخصی‌سازی‌شده ({Number(form.customMonthly3Price).toLocaleString('fa-IR')} تومان)
                  </span>
                )}
              </div>

              {/* بسته ۶ ماهه */}
              <div className="space-y-1.5 bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="text-slate-400">{t("custom6MonthsPrice") || "بسته ۶ ماهه"}</span>
                  <span className="text-teal-400/90 font-mono">
                    پیش‌فرض: {globalSettings?.monthly6Price?.toLocaleString('fa-IR') || "۴۴۹,۰۰۰"} تومان
                  </span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    name="customMonthly6Price"
                    value={form.customMonthly6Price}
                    onChange={handleChange}
                    placeholder="پیش‌فرض سایت"
                    className={`w-full bg-slate-900 border rounded-xl px-3 py-2 text-sm text-white focus:outline-none font-mono ${
                      form.customMonthly6Price !== "" ? "border-amber-500/60 bg-amber-500/5 text-amber-300 font-bold" : "border-slate-700 focus:border-teal-500"
                    }`}
                  />
                  {form.customMonthly6Price !== "" && (
                    <button
                      type="button"
                      onClick={() => handleResetToDefaultPricing('customMonthly6Price')}
                      className="absolute left-2 text-[10px] bg-slate-800 hover:bg-slate-700 text-amber-400 px-2 py-1 rounded-lg border border-slate-600 transition-all"
                      title="بازگشت به پیش‌فرض سایت"
                    >
                      پیش‌فرض
                    </button>
                  )}
                </div>
                {form.customMonthly6Price !== "" && (
                  <span className="block text-[10px] text-amber-400/80 pt-0.5">
                    ✓ تعرفه شخصی‌سازی‌شده ({Number(form.customMonthly6Price).toLocaleString('fa-IR')} تومان)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-3 bg-slate-900/60 p-5 rounded-2xl border border-slate-700/40 flex flex-col justify-between">
              <div>
                <span className="block text-xs font-medium text-slate-300 mb-1">{t("giftStatusLabel") || "وضعیت هدیه"}</span>
                <span className={`inline-block text-xs font-bold ${targetUser?.hasReceivedFirstBonus ? "text-emerald-400" : "text-amber-400"}`}>
                  {targetUser?.hasReceivedFirstBonus ? (t("receivedGiftText") || "دریافت کرده") : (t("notReceivedGiftText") || "دریافت نکرده")}
                </span>
              </div>
              
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-2 border-t border-slate-800">
                <input 
                  type="checkbox" 
                  name="resetBonus" 
                  checked={form.resetBonus}
                  onChange={handleChange}
                  value="true" 
                  className="rounded bg-slate-900 border-slate-700 text-teal-500 focus:ring-0" 
                />
                <span>{t("resetBonusLabel") || "بازنشانی وضعیت هدیه اولیه"}</span>
              </label>
            </div>

            <div className="space-y-3 bg-slate-900/60 p-5 rounded-2xl border border-slate-700/40 flex flex-col justify-between">
              <div>
                <span className="block text-xs font-medium text-slate-300 mb-1">{t("roleHeader") || "نقش کاربر"}</span>
                <span className={`inline-block text-xs font-bold ${form.isAdmin ? "text-amber-400" : "text-slate-400"}`}>
                  {form.isAdmin ? (t("adminUser") || "مدیر سیستم") : (t("normalUser") || "کاربر عادی")}
                </span>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-2 border-t border-slate-800">
                <input 
                  type="checkbox" 
                  name="isAdmin" 
                  checked={form.isAdmin}
                  onChange={handleChange}
                  value="true" 
                  className="rounded bg-slate-900 border-slate-700 text-teal-500 focus:ring-0" 
                />
                <span>{t("grantAdminLabel") || "اعطای دسترسی مدیریت"}</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700/60 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-bold py-3 px-8 rounded-2xl transition-all shadow-lg shadow-teal-500/20 text-xs disabled:opacity-50"
            >
              {saving ? (t("savingText") || "در حال ذخیره...") : (t("saveUserChanges") || "ذخیره تغییرات")}
            </button>
          </div>
        </form>

        {/* لیست تراکنش‌ها با دکمه حذف هوشمند */}
        <div className="bg-slate-800/50 border border-slate-700/60 p-6 rounded-3xl backdrop-blur-md shadow-lg space-y-4">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <span>📜</span> {t("transactionsHeading") || "تاریخچه تراکنش‌های کاربر"}
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400">
                  <th className="py-2.5 px-3">{t("txIdHeader") || "شناسه تراکنش"}</th>
                  <th className="py-2.5 px-3">{t("amountHeader") || "مبلغ (تومان)"}</th>
                  <th className="py-2.5 px-3">{t("statusHeaderTx") || "وضعیت"}</th>
                  <th className="py-2.5 px-3">{t("dateHeaderTx") || "تاریخ"}</th>
                  <th className="py-2.5 px-3 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {!targetUser?.transactions || targetUser.transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      {t("noTransactionsText") || "تراکنشی ثبت نشده است."}
                    </td>
                  </tr>
                ) : (
                  targetUser.transactions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-slate-700/25 transition-all">
                      <td className="py-3 px-3 font-mono text-slate-300">{tx.id}</td>
                      <td className="py-3 px-3 text-emerald-400 font-bold">{tx.amount?.toLocaleString('fa-IR') || 0}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px]">{t("successStatusTx") || "موفق"}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">{new Date(tx.createdAt).toLocaleDateString(lang === 'fa' ? 'fa-IR' : 'en-US')}</td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteTransaction(tx.id)}
                          className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-[11px] transition-all"
                        >
                          {t("deleteTxBtn") || "حذف تراکنش"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}