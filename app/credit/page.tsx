"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function CreditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get("payment") === "success";

  const [loading, setLoading] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [successMessage, setSuccessMessage] = useState(isSuccess);
  const [packages, setPackages] = useState([
    { id: "basic", title: "پکیج ۱ ماهه", duration: "دسترسی نامحدود ۳۰ روزه", price: "۹۹,۰۰۰ تومان", popular: false },
    { id: "3_month", title: "پکیج ۳ ماهه (پیشنهادی)", duration: "دسترسی نامحدود ۹۰ روزه", price: "۲۴۹,۰۰۰ تومان", popular: true },
    { id: "6_month", title: "پکیج ۶ ماهه", duration: "دسترسی نامحدود ۱۸۰ روزه", price: "۴۴۹,۰۰۰ تومان", popular: false },
  ]);

  // دریافت تنظیمات و تعرفه‌های اختصاصی کاربر به همراه تاریخچه تراکنش‌ها
  useEffect(() => {
    async function fetchData() {
      try {
        // اصلاح مسیر به مسیر صحیح بک‌اند برای پکیج‌های کاربر
        const settingsRes = await fetch("/api/user/package/", {
          cache: "no-store",
          credentials: "include"
        });
        
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          setPackages([
            {
              id: "basic",
              title: "پکیج ۱ ماهه",
              duration: "دسترسی نامحدود ۳۰ روزه",
              price: `${(settings.monthly1Price || 99000).toLocaleString('fa-IR')} تومان`,
              popular: false,
            },
            {
              id: "3_month",
              title: "پکیج ۳ ماهه (پیشنهادی)",
              duration: "دسترسی نامحدود ۹۰ روزه",
              price: `${(settings.monthly3Price || 249000).toLocaleString('fa-IR')} تومان`,
              popular: true,
            },
            {
              id: "6_month",
              title: "پکیج ۶ ماهه",
              duration: "دسترسی نامحدود ۱۸۰ روزه",
              price: `${(settings.monthly6Price || 449000).toLocaleString('fa-IR')} تومان`,
              popular: false,
            },
          ]);
        }
        
        const txRes = await fetch("/api/payment/history");
        if (txRes.ok) {
          const txData = await txRes.json();
          if (txData.transactions) {
            setTransactions(txData.transactions);
          }
        }
      } catch (err) {
        console.error("Failed to load page data:", err);
      }
    }
    fetchData();
  }, []);

  const handlePurchase = async (packageId: string) => {
    setLoading(packageId);
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });

      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "خطا در اتصال به درگاه پرداخت");
      }
    } catch (err) {
      console.error("Payment error:", err);
      alert("خطای شبکه در ارتباط با سرور");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* پیام موفقیت‌آمیز پس از بازگشت از پرداخت */}
        {successMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3 space-x-reverse">
              <span className="text-xl">✅</span>
              <div>
                <p className="font-bold text-sm">پرداخت با موفقیت انجام شد!</p>
                <p className="text-xs opacity-90">اشتراک نامحدود شما با موفقیت فعال گردید.</p>
              </div>
            </div>
            <button 
              onClick={() => setSuccessMessage(false)} 
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              بستن
            </button>
          </div>
        )}

        {/* هدر صفحه و دکمه بازگشت */}
        <div className="flex items-center justify-between bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-zinc-700">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">
              خرید اشتراک نامحدود نوا
            </h1>
            <p className="text-sm text-gray-600 dark:text-zinc-400">
              پکیج اشتراک زمانی متناسب با نیاز خود را انتخاب کنید و بدون محدودیت تعداد پیام گفتگو کنید.
            </p>
          </div>
          <Link
            href="/chat"
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-gray-800 dark:text-gray-200 text-xs rounded-xl transition-all"
          >
            رفتن به صفحه چت
          </Link>
        </div>

        {/* لیست پکیج‌ها */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-8 flex flex-col justify-between border ${
                pkg.popular
                  ? "border-emerald-500 ring-2 ring-emerald-500/20"
                  : "border-gray-200 dark:border-zinc-700"
              }`}
            >
              {pkg.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                  محبوب‌ترین
                </span>
              )}
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {pkg.title}
                </h3>
                <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 my-6">
                  {pkg.duration}
                </div>
                <div className="text-lg font-semibold text-gray-700 dark:text-zinc-300 mb-6">
                  {pkg.price}
                </div>
              </div>
              <button
                onClick={() => handlePurchase(pkg.id)}
                disabled={loading === pkg.id}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-xl transition duration-200 disabled:opacity-50 shadow-md shadow-emerald-600/10"
              >
                {loading === pkg.id ? "در حال اتصال..." : "خرید اشتراک"}
              </button>
            </div>
          ))}
        </div>

        {/* جدول تاریخچه تراکنش‌ها */}
        <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 p-6 rounded-2xl shadow-lg space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">تاریخچه خرید اشتراک‌ها</h2>

          {transactions.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-zinc-400 py-6 text-center">
              هنوز هیچ تراکنشی ثبت نشده است.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm text-gray-700 dark:text-zinc-300">
                <thead className="border-b border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 text-xs uppercase">
                  <tr>
                    <th className="py-3 px-4">تاریخ</th>
                    <th className="py-3 px-4">نوع اشتراک</th>
                    <th className="py-3 px-4">مبلغ پرداخت‌شده</th>
                    <th className="py-3 px-4">وضعیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-zinc-700/20">
                      <td className="py-3 px-4 font-mono text-xs">
                        {new Date(tx.createdAt).toLocaleDateString('fa-IR')}
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                        {tx.amount >= 440000 ? "اشتراک ۶ ماهه" : tx.amount >= 240000 ? "اشتراک ۳ ماهه" : "اشتراک ۱ ماهه"}
                      </td>
                      <td className="py-3 px-4">
                        {tx.amount?.toLocaleString('fa-IR')} تومان
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          tx.status === 'SUCCESS' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}>
                          {tx.status === 'SUCCESS' ? 'موفق' : 'نامشخص'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}