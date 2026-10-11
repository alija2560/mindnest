"use client";
import { useLang } from "@/app/context/LanguageContext";
import { useRouter } from "next/navigation";

export function LanguageSwitcher() {
  const { lang, setLang } = useLang();
  const router = useRouter();

  const toggleLanguage = () => {
    const newLang = lang === "fa" ? "en" : "fa";
    setLang(newLang);
    document.cookie = `nava_lang=${newLang}; path=/; max-age=31536000`;
    router.refresh();
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/30 text-xs text-slate-300 hover:text-teal-400 transition-all shadow-sm backdrop-blur-md cursor-pointer font-mono font-bold"
      title="تغییر زبان / Change Language"
    >
      <span>🌐</span>
      <span>{lang === "fa" ? "EN" : "فارسی"}</span>
    </button>
  );
}