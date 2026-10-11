"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { dictionary, Lang } from "@/lib/dictionary";

interface User {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  role: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
    fetch("/api/admin/users", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Error fetching data");
        }
        return res.json();
      })
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400 text-sm font-sans">
        {t("loadingUsersText")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-red-400 text-sm font-sans">
        ❌ {error}
      </div>
    );
  }

  return (
    <div dir={lang === 'fa' ? 'rtl' : 'ltr'} className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* هدر صفحه به همراه دکمه‌های ناوبری */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-100">{t("usersPageTitle")}</h1>
            <p className="text-xs text-slate-400 mt-1">{t("usersPageSubtitle")}</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/settings"
              className="px-4 py-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-xs text-teal-400 font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>⚙️</span> {t("generalSiteSettings")}
            </Link>

            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition-all"
            >
              {t("backToDashboard")}
            </Link>
          </div>
        </div>

        {/* جدول کاربران */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4 font-medium">{t("nameHeaderUserList")}</th>
                  <th className="p-4 font-medium">{t("phoneHeaderUserList")}</th>
                  <th className="p-4 font-medium">{t("emailHeaderUserList")}</th>
                  <th className="p-4 font-medium">{t("roleHeaderUserList")}</th>
                  <th className="p-4 font-medium">{t("joinDateHeaderUserList")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => {
                  const isAdmin = u.role === 'ADMIN';
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-medium text-slate-200">{u.name || t("notRegisteredUserList")}</td>
                      <td className="p-4 font-mono text-slate-400" dir="ltr">{u.phone}</td>
                      <td className="p-4 text-slate-400" dir="ltr">{u.email || t("notRegisteredUserList")}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${isAdmin ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-teal-500/10 text-teal-400 border border-teal-500/20'}`}>
                          {isAdmin ? t("adminRoleUserList") : t("normalUserRoleUserList")}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 font-mono">
                        {new Date(u.createdAt).toLocaleDateString(lang === 'fa' ? 'fa-IR' : 'en-US')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}