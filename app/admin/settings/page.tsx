"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { dictionary, Lang } from "@/lib/dictionary";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [lang, setLang] = useState<Lang>("fa");

  const [form, setForm] = useState({
    initialGiftLimit: 50,
    dailyFreeLimit: 5,
    monthly1Credits: 200,
    monthly1Price: 99000,
    monthly3Credits: 700,
    monthly3Price: 249000,
    monthly6Credits: 1600,
    monthly6Price: 449000,
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

  useEffect(() => {
    fetch("/api/admin/settings", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setForm(data.settings);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading settings:", err);
        setLoading(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(t("settingsSuccessMsg"));
      } else {
        setMessage(data.error || "Error saving information");
      }
    } catch (err) {
      setMessage("Network error connecting to server");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center font-sans">
        <p>{t("loadingSettingsText")}</p>
      </div>
    );
  }

  return (
    <div dir={lang === 'fa' ? 'rtl' : 'ltr'} className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* هدر پنل */}
        <div className="flex items-center justify-between bg-slate-800/80 p-6 rounded-3xl border border-slate-700/80 shadow-xl">
          <div>
            <h1 className="text-2xl font-extrabold text-white mb-1">{t("settingsPageHeading")}</h1>
            <p className="text-sm text-slate-400">{t("settingsPageSubtitle")}</p>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-700 border border-slate-700 text-xs rounded-xl transition-all"
          >
            {t("backToDashboard")}
          </Link>
        </div>

        {/* فرم تنظیمات */}
        <form onSubmit={handleSubmit} className="bg-slate-800/50 border border-slate-700/60 p-8 rounded-3xl backdrop-blur-md shadow-lg space-y-6">
          
          {message && (
            <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm text-center">
              {message}
            </div>
          )}

          {/* بخش سهمیه‌های پایه */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-teal-400 border-b border-slate-700 pb-2">{t("quotasSectionTitle")}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-2">{t("initialGiftInputLabel")}</label>
                <input
                  type="number"
                  name="initialGiftLimit"
                  value={form.initialGiftLimit}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-2">{t("dailyFreeInputLabel")}</label>
                <input
                  type="number"
                  name="dailyFreeLimit"
                  value={form.dailyFreeLimit}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* بخش تنظیمات پکیج‌ها */}
          <div className="space-y-4 pt-4">
            <h2 className="text-lg font-bold text-teal-400 border-b border-slate-700 pb-2">{t("packagesSectionTitle")}</h2>
            
            {/* پکیج ۱ ماهه */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-700/40">
              <h3 className="md:col-span-2 font-semibold text-sm text-slate-300">{t("monthly1Title")}</h3>
              <div>
                <label className="block text-xs text-slate-400 mb-1">{t("messageCountFieldLabel")}</label>
                <input
                  type="number"
                  name="monthly1Credits"
                  value={form.monthly1Credits}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">{t("priceFieldLabel")}</label>
                <input
                  type="number"
                  name="monthly1Price"
                  value={form.monthly1Price}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* پکیج ۳ ماهه */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-700/40">
              <h3 className="md:col-span-2 font-semibold text-sm text-slate-300">{t("monthly3Title")}</h3>
              <div>
                <label className="block text-xs text-slate-400 mb-1">{t("messageCountFieldLabel")}</label>
                <input
                  type="number"
                  name="monthly3Credits"
                  value={form.monthly3Credits}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">{t("priceFieldLabel")}</label>
                <input
                  type="number"
                  name="monthly3Price"
                  value={form.monthly3Price}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* پکیج ۶ ماهه */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-700/40">
              <h3 className="md:col-span-2 font-semibold text-sm text-slate-300">{t("monthly6Title")}</h3>
              <div>
                <label className="block text-xs text-slate-400 mb-1">{t("messageCountFieldLabel")}</label>
                <input
                  type="number"
                  name="monthly6Credits"
                  value={form.monthly6Credits}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">{t("priceFieldLabel")}</label>
                <input
                  type="number"
                  name="monthly6Price"
                  value={form.monthly6Price}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-bold py-3 px-4 rounded-2xl transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50 text-xs"
            >
              {saving ? t("savingSettingsBtn") : t("saveSettingsBtn")}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}