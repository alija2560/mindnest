"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Transaction {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  description?: string;
}

interface MessageItem {
  id: string;
  content: string;
  createdAt: string;
  role: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function UserReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  
  const [txMeta, setTxMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [msgMeta, setMsgMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  
  const [txPage, setTxPage] = useState(1);
  const [msgPage, setMsgPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"transactions" | "messages">("transactions");

  useEffect(() => {
    setIsLoading(true);
    const currentPage = activeTab === "transactions" ? txPage : msgPage;

    fetch(`/api/user/reports?page=${currentPage}&limit=10`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTransactions(data.data.transactions?.items || []);
          setTxMeta({
            total: data.data.transactions?.total || 0,
            page: data.data.transactions?.page || 1,
            limit: data.data.transactions?.limit || 10,
            totalPages: data.data.transactions?.totalPages || 1,
          });

          setMessages(data.data.messages?.items || []);
          setMsgMeta({
            total: data.data.messages?.total || 0,
            page: data.data.messages?.page || 1,
            limit: data.data.messages?.limit || 10,
            totalPages: data.data.messages?.totalPages || 1,
          });
        } else {
          setErrorMessage(data.message || "خطا در دریافت اطلاعات گزارش‌ها");
        }
      })
      .catch(() => setErrorMessage("خطا در ارتباط با سرور"))
      .finally(() => setIsLoading(false));
  }, [txPage, msgPage, activeTab]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans selection:bg-teal-500 selection:text-slate-950" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* هدر صفحه همراه با دکمه بازگشت به داشبورد */}
        <div className="flex items-center justify-between bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl shadow-xl">
          <div>
            <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
              📊 گزارش‌ها و تاریخچه فعالیت‌ها
            </h1>
            <p className="text-xs text-slate-400 mt-1">مشاهده پویا و کامل سوابق تراکنش‌ها و پیام‌های شما</p>
          </div>
          <Link
            href="/dashboard"
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl transition-all border border-slate-700/50 shadow-sm"
          >
            ← بازگشت به داشبورد
          </Link>
        </div>

        {/* دکمه‌های تب */}
        <div className="flex gap-3 border-b border-slate-800 pb-4">
          <button
            onClick={() => setActiveTab("transactions")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
              activeTab === "transactions"
                ? "bg-teal-500 text-slate-950 shadow-teal-500/20"
                : "bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800"
            }`}
          >
            💳 تاریخچه تراکنش‌ها ({txMeta.total})
          </button>
          <button
            onClick={() => setActiveTab("messages")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
              activeTab === "messages"
                ? "bg-teal-500 text-slate-950 shadow-teal-500/20"
                : "bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800"
            }`}
          >
            💬 تاریخچه پیام‌ها ({msgMeta.total})
          </button>
        </div>

        {/* محتوای تب‌ها */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20 text-teal-400 text-xs gap-3">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            در حال بارگذاری اطلاعات...
          </div>
        ) : errorMessage ? (
          <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-center text-red-400 text-xs">
            {errorMessage}
          </div>
        ) : activeTab === "transactions" ? (
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
            <h2 className="text-sm font-bold text-slate-200">لیست تراکنش‌های مالی شما</h2>
            {transactions.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">تراکنشی ثبت نشده است.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-3 px-4">شناسه تراکنش</th>
                        <th className="py-3 px-4">مبلغ (تومان)</th>
                        <th className="py-3 px-4">وضعیت</th>
                        <th className="py-3 px-4">تاریخ ثبت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-slate-400" dir="ltr">{tx.id}</td>
                          <td className="py-3.5 px-4 text-emerald-400 font-bold">{tx.amount ? tx.amount.toLocaleString() : 0}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full font-medium ${tx.status === 'SUCCESS' || tx.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                              {tx.status === 'SUCCESS' || tx.status === 'PAID' ? 'موفق' : tx.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-400" dir="ltr">{new Date(tx.createdAt).toLocaleString('fa-IR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {txMeta.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
                    <button
                      disabled={txPage <= 1}
                      onClick={() => setTxPage((prev) => Math.max(prev - 1, 1))}
                      className="px-4 py-2 bg-slate-800 disabled:opacity-40 rounded-xl hover:bg-slate-700 transition"
                    >
                      ← صفحه قبل
                    </button>
                    <span className="text-slate-400">
                      صفحه {txMeta.page} از {txMeta.totalPages}
                    </span>
                    <button
                      disabled={txPage >= txMeta.totalPages}
                      onClick={() => setTxPage((prev) => prev + 1)}
                      className="px-4 py-2 bg-slate-800 disabled:opacity-40 rounded-xl hover:bg-slate-700 transition"
                    >
                      صفحه بعد →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
            <h2 className="text-sm font-bold text-slate-200">تاریخچه پیام‌های رد و بدل شده</h2>
            {messages.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">پیامی یافت نشد.</p>
            ) : (
              <>
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-semibold text-teal-400">{msg.role === 'user' ? 'کاربر' : 'هوش مصنوعی'}</span>
                        <span dir="ltr">{new Date(msg.createdAt).toLocaleString('fa-IR')}</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ))}
                </div>

                {msgMeta.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
                    <button
                      disabled={msgPage <= 1}
                      onClick={() => setMsgPage((prev) => Math.max(prev - 1, 1))}
                      className="px-4 py-2 bg-slate-800 disabled:opacity-40 rounded-xl hover:bg-slate-700 transition"
                    >
                      ← صفحه قبل
                    </button>
                    <span className="text-slate-400">
                      صفحه {msgMeta.page} از {msgMeta.totalPages}
                    </span>
                    <button
                      disabled={msgPage >= msgMeta.totalPages}
                      onClick={() => setMsgPage((prev) => prev + 1)}
                      className="px-4 py-2 bg-slate-800 disabled:opacity-40 rounded-xl hover:bg-slate-700 transition"
                    >
                      صفحه بعد →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}