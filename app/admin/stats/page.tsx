"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { dictionary, Lang } from "@/lib/dictionary";

interface UserItem {
  id: string;
  phone: string;
  email?: string | null;
  credit: number;
  messageCount: number;
  isActive?: boolean;
  isAdmin?: boolean;
  createdAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<{ totalUsers: number; totalRevenue: number; users: UserItem[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
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

  const fetchAdminData = () => {
    fetch("/api/admin/stats", { credentials: "include" })
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          window.location.href = "/chat";
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.success) {
          setStats(data.data);
        } else {
          setErrorMessage(data.message || "Error fetching data");
        }
      })
      .catch(() => setErrorMessage("Server connection error"))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const toggleUserStatus = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle`, {
        method: "PATCH",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setStats((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            users: prev.users.map((u) => (u.id === userId ? { ...u, isActive: data.data.isActive } : u)),
          };
        });
      } else {
        alert(data.message || "Error updating user status");
      }
    } catch (err) {
      console.error(err);
      alert("Server connection error");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleAdminStatus = async (userId: string) => {
    if (!confirm(t("confirmAdminChange"))) return;
    
    setAdminLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/make-admin`, {
        method: "PATCH",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setStats((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            users: prev.users.map((u) => (u.id === userId ? { ...u, isAdmin: data.data.isAdmin } : u)),
          };
        });
      } else {
        alert(data.message || "Error changing access level");
      }
    } catch (err) {
      console.error(err);
      alert("Server connection error");
    } finally {
      setAdminLoading(null);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!stats?.users) return [];
    return stats.users.filter((user) => {
      const phoneMatch = user.phone ? user.phone.includes(searchQuery.trim()) : false;
      return phoneMatch;
    });
  }, [stats?.users, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-teal-400 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400">{t("loadingText")}</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-950 text-red-400 gap-4 font-sans p-4">
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-center max-w-md w-full">
          <p className="text-base font-semibold mb-3">❌ {errorMessage}</p>
          <a href="/chat" className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl transition-all inline-block">
            {t("backToDashboard")}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div dir={lang === 'fa' ? 'rtl' : 'ltr'} className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-10 font-sans selection:bg-teal-500 selection:text-slate-950">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        
        {/* هدر پنل */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-5 md:p-6 rounded-2xl shadow-xl">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
              🛡️ {t("adminTitle")}
            </h1>
            <p className="text-xs text-slate-400 mt-1">{t("adminSubtitle")}</p>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Link
              href="/admin/settings"
              className="flex-1 sm:flex-none text-center text-xs bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-400 font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <span>⚙</span> {t("generalSiteSettings")}
            </Link>

            <a href="/dashboard" className="flex-1 sm:flex-none text-center text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl transition-all border border-slate-700/50 shadow-sm flex items-center justify-center gap-2">
              <span>←</span> {t("backToDashboard")}
            </a>
          </div>
        </div>

        {/* کارت‌های آماری کلی */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800/80 p-5 md:p-6 rounded-2xl shadow-xl relative overflow-hidden">
            <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl"></div>
            <div className="text-xs font-medium text-slate-400 mb-2">{t("totalUsersCount")}</div>
            <div className="text-3xl md:text-4xl font-black text-teal-400 tracking-tight">
              {stats?.totalUsers || 0} <span className="text-sm font-normal text-slate-400">{lang === 'fa' ? 'نفر' : 'users'}</span>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800/80 p-5 md:p-6 rounded-2xl shadow-xl relative overflow-hidden">
            <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
            <div className="text-xs font-medium text-slate-400 mb-2">{t("totalRevenueCount")}</div>
            <div className="text-3xl md:text-4xl font-black text-emerald-400 tracking-tight">
              {stats?.totalRevenue ? stats.totalRevenue.toLocaleString() : 0} <span className="text-sm font-normal text-slate-400">{lang === 'fa' ? 'تومان' : 'Toman'}</span>
            </div>
          </div>
        </div>

        {/* مدیریت کاربران */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 md:p-6 shadow-xl space-y-6">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <h2 className="text-base font-bold text-slate-200 flex items-center gap-2 self-start md:self-auto">
              <span>👥</span> {t("manageUsers")}
            </h2>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder={t("searchByPhone")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                  dir="ltr"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 self-end sm:self-auto">
                <span>{t("displayCount")}</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500 transition-colors"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* نمایش به صورت جدول در دسکتاپ و کارت در موبایل */}
          <div className="overflow-hidden">
            
            {paginatedUsers.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs bg-slate-950/40 rounded-2xl border border-slate-800/50">
                {t("noUserFound")}
              </div>
            ) : (
              <>
                {/* نمای کارتی برای موبایل */}
                <div className="block lg:hidden space-y-3">
                  {paginatedUsers.map((user) => {
                    const isActive = user.isActive ?? true;
                    const isAdmin = user.isAdmin ?? false;

                    return (
                      <div key={user.id} className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                          <span className="text-xs font-bold text-slate-300 font-mono" dir="ltr">{user.phone || "—"}</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${isAdmin ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-400'}`}>
                              {isAdmin ? t("adminUser") : t("normalUser")}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                              <span className={`w-1 h-1 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                              {isActive ? t("activeStatus") : t("blockedStatus")}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                          <div>
                            <span className="text-slate-500 block text-[10px]">{t("emailHeader")}</span>
                            <span className="text-slate-200 truncate block">{user.email || "—"}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">{t("joinDateHeader")}</span>
                            <span className="text-slate-200">{new Date(user.createdAt).toLocaleDateString(lang === 'fa' ? 'fa-IR' : 'en-US')}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">{t("creditHeader")}</span>
                            <span className="text-teal-400 font-bold">{user.credit}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">{t("messageCountHeader")}</span>
                            <span className="text-slate-200">{user.messageCount}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
                          <button
                            onClick={() => toggleUserStatus(user.id)}
                            disabled={actionLoading === user.id}
                            className={`text-[11px] px-3 py-1.5 rounded-xl font-medium transition-all shadow-sm ${isActive ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'} disabled:opacity-50`}
                          >
                            {actionLoading === user.id ? t("processingText") : isActive ? t("blockAccessBtn") : t("openAccessBtn")}
                          </button>

                          <button
                            onClick={() => toggleAdminStatus(user.id)}
                            disabled={adminLoading === user.id}
                            className={`text-[11px] px-3 py-1.5 rounded-xl font-medium transition-all shadow-sm border ${isAdmin ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'} disabled:opacity-50`}
                          >
                            {adminLoading === user.id ? t("processingText") : isAdmin ? t("revokeAdminBtn") : t("makeAdminBtn")}
                          </button>

                          <Link
                            href={`/admin/users/${user.id}/manage`}
                            className="px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 rounded-xl text-[11px] font-semibold transition-all shadow-sm"
                          >
                            {t("manageUserBtn")}
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* نمای جدول برای دسکتاپ */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-xs text-slate-400">
                        <th className="py-3 px-4 font-semibold">{t("phoneHeader")}</th>
                        <th className="py-3 px-4 font-semibold">{t("emailHeader")}</th>
                        <th className="py-3 px-4 font-semibold">{t("creditHeader")}</th>
                        <th className="py-3 px-4 font-semibold">{t("messageCountHeader")}</th>
                        <th className="py-3 px-4 font-semibold">{t("roleHeader")}</th>
                        <th className="py-3 px-4 font-semibold">{t("statusHeader")}</th>
                        <th className="py-3 px-4 font-semibold">{t("joinDateHeader")}</th>
                        <th className="py-3 px-4 font-semibold text-center">{t("accessOpsHeader")}</th>
                        <th className="py-3 px-4 font-semibold text-center">{t("adminOpsHeader")}</th>
                        <th className="py-3 px-4 font-semibold text-center">{t("userMgmtHeader")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-sm">
                      {paginatedUsers.map((user) => {
                        const isActive = user.isActive ?? true;
                        const isAdmin = user.isAdmin ?? false;

                        return (
                          <tr key={user.id} className="hover:bg-slate-800/30 transition-colors group">
                            <td className="py-3.5 px-4 font-medium text-slate-200 font-mono" dir="ltr">{user.phone || "—"}</td>
                            <td className="py-3.5 px-4 text-slate-300">{user.email || "—"}</td>
                            <td className="py-3.5 px-4 text-teal-400 font-bold">{user.credit}</td>
                            <td className="py-3.5 px-4 text-slate-300">{user.messageCount}</td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isAdmin ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-400'}`}>
                                {isAdmin ? t("adminUser") : t("normalUser")}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                                {isActive ? t("activeStatus") : t("blockedStatus")}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-400 text-xs">{new Date(user.createdAt).toLocaleDateString(lang === 'fa' ? 'fa-IR' : 'en-US')}</td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => toggleUserStatus(user.id)}
                                disabled={actionLoading === user.id}
                                className={`text-xs px-3.5 py-1.5 rounded-xl font-medium transition-all shadow-sm ${isActive ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'} disabled:opacity-50`}
                              >
                                {actionLoading === user.id ? t("processingText") : isActive ? t("blockAccessBtn") : t("openAccessBtn")}
                              </button>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => toggleAdminStatus(user.id)}
                                disabled={adminLoading === user.id}
                                className={`text-xs px-3.5 py-1.5 rounded-xl font-medium transition-all shadow-sm border ${isAdmin ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20' : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border-indigo-500/20'} disabled:opacity-50`}
                              >
                                {adminLoading === user.id ? t("processingText") : isAdmin ? t("revokeAdminBtn") : t("makeAdminBtn")}
                              </button>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <Link
                                href={`/admin/users/${user.id}/manage`}
                                className="inline-block px-3.5 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 rounded-xl text-xs font-semibold transition-all shadow-sm"
                              >
                                {t("manageUserBtn")}
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* نوار صفحه‌بندی کامل در پایین */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800 text-xs">
              <span className="text-slate-400 text-center sm:text-right">
                {t("pageText")} <strong className="text-slate-200">{currentPage}</strong> {t("ofText")} <strong className="text-slate-200">{totalPages}</strong> ({t("totalUsersText")} {filteredUsers.length})
              </span>

              <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-2 sm:pb-0">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="bg-slate-800/60 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700/50"
                >
                  ««
                </button>

                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="bg-slate-800/60 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700/50"
                >
                  ‹
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg font-medium transition-all border flex items-center justify-center shrink-0 ${
                      currentPage === page
                        ? 'bg-teal-500 text-slate-950 border-teal-400 font-bold shadow-md shadow-teal-500/10'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="bg-slate-800/60 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700/50"
                >
                  ›
                </button>

                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="bg-slate-800/60 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700/50"
                >
                  »»
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}