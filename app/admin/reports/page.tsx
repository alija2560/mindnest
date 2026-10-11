"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { dictionary, Lang } from "@/lib/dictionary";

interface AdminTransaction {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  user?: {
    id: string;
    phone?: string;
    email?: string;
  };
}

export default function AdminReportsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [lang, setLang] = useState<Lang>("fa");

  useEffect(() => {
    const savedLang = localStorage.getItem("nava_lang") as Lang;
    if (savedLang === "fa" || savedLang === "en") {
      setLang(savedLang);
    }
  }, []);

  const t = (key: keyof typeof dictionary.fa) => {
    return dictionary[lang]?.[key] || dictionary["fa"][key] || key;
  };

  useEffect(() => {
    setIsLoading(true);
    setErrorMessage("");

    fetch(`/api/admin/reports?page=${page}&limit=15`, { credentials: "include" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || t("unauthorizedReportError"));
        }
        return data;
      })
      .then((data) => {
        if (data.success && data.data) {
          setTransactions(data.data.transactions?.items || []);
          setTotalRevenue(data.data.totalRevenue || 0);
          setTotalPages(data.data.transactions?.totalPages || 1);
          setTotalCount(data.data.transactions?.total || 0);
        } else {
          setErrorMessage("Data received from server is not valid.");
        }
      })
      .catch((err) => {
        console.error("Fetch Admin Reports Error:", err);
        setErrorMessage(err.message || "Server connection error");
      })
      .finally(() => setIsLoading(false));
  }, [page]);

  return (
    <div dir={lang === 'fa' ? 'rtl' : 'ltr'} className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans selection:bg-teal-500 selection:text-slate-950">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* هدر همراه با دکمه‌های ناوبری */}
        <div className="flex items-center justify-between bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl shadow-xl">
          <div>
            <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-400">
              {t("adminReportsTitle")}
            </h1>
            <p className="text-xs text-slate-400 mt-1">{t("adminReportsSubtitle")}</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl transition-all border border-slate-700/50 shadow-sm"
            >
              {t("backToDashboard")}
            </Link>
            <Link
              href="/reports"
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl transition-all border border-slate-700/50 shadow-sm"
            >
              {t("myReportsLink")}
            </Link>
          </div>
        </div>

        {errorMessage ? (
          <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl text-center space-y-4">
            <div className="text-red-400 text-sm font-bold">⛔ Access Error</div>
            <p className="text-xs text-slate-300">{errorMessage}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs rounded-xl transition text-slate-200"
            >
              {t("backToDashboard")}
            </button>
          </div>
        ) : (
          <>
            {/* کارت آمار درآمد */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl shadow-xl space-y-2">
                <span className="text-xs text-slate-400">{t("totalRevenueSuccessLabel")}</span>
                <div className="text-2xl font-black text-emerald-400">
                  {totalRevenue.toLocaleString()} <span className="text-xs font-normal text-slate-400">{lang === 'fa' ? 'تومان' : 'Toman'}</span>
                </div>
              </div>
              <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl shadow-xl space-y-2">
                <span className="text-xs text-slate-400">{t("totalTxCountLabel")}</span>
                <div className="text-2xl font-black text-teal-400">
                  {totalCount.toLocaleString()} <span className="text-xs font-normal text-slate-400">{lang === 'fa' ? 'مورد' : 'items'}</span>
                </div>
              </div>
            </div>

            {/* جدول */}
            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
              <h2 className="text-sm font-bold text-slate-200">{t("txHistoryHeading")}</h2>
              
              {isLoading ? (
                <div className="flex justify-center items-center py-20 text-amber-400 text-xs gap-3">
                  <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                  {t("loadingAdminReportsText")}
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <p className="text-xs text-slate-400">{t("emptyTxTitle")}</p>
                  <p className="text-[11px] text-slate-500">{t("emptyTxDesc")}</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="py-3 px-4">{t("txIdHeaderReport")}</th>
                          <th className="py-3 px-4">{t("userHeaderReport")}</th>
                          <th className="py-3 px-4">{t("amountHeaderReport")}</th>
                          <th className="py-3 px-4">{t("statusHeaderReport")}</th>
                          <th className="py-3 px-4">{t("dateHeaderReport")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3.5 px-4 font-mono text-slate-400" dir="ltr">{tx.id}</td>
                            <td className="py-3.5 px-4 text-slate-300">
                              {tx.user?.phone || tx.user?.email || `${t("unknownUserReport")}: ${tx.user?.id || '—'}`}
                            </td>
                            <td className="py-3.5 px-4 text-emerald-400 font-bold">{tx.amount.toLocaleString()}</td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-1 rounded-full font-medium ${tx.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                {tx.status === 'SUCCESS' ? t("successTxStatus") : tx.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-400">{new Date(tx.createdAt).toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* کنترل‌های صفحه‌بندی ادمین */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
                      <button
                        disabled={page <= 1}
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        className="px-4 py-2 bg-slate-800 disabled:opacity-40 rounded-xl hover:bg-slate-700 transition"
                      >
                        {t("prevPageBtn")}
                      </button>
                      <span className="text-slate-400">
                        {t("pageText")} {page} {t("ofText")} {totalPages}
                      </span>
                      <button
                        disabled={page >= totalPages}
                        onClick={() => setPage((prev) => prev + 1)}
                        className="px-4 py-2 bg-slate-800 disabled:opacity-40 rounded-xl hover:bg-slate-700 transition"
                      >
                        {t("nextPageBtn")}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}