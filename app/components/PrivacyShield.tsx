"use client";

import { useEffect, useState } from "react";

export default function PrivacyShield() {
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // وقتی کاربر تب را عوض کرد یا پنجره را مینیمایز کرد
        setIsHidden(true);
      }
    };

    const handleWindowBlur = () => {
      // وقتی تمرکز از پنجره مرورگر خارج شد
      setIsHidden(true);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, []);

  const handleUnlock = () => {
    setIsHidden(false);
  };

  if (!isHidden) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#06080d]/95 backdrop-blur-xl animate-in fade-in duration-150">
      <div className="max-w-md p-8 text-center space-y-4 bg-[#0d1117] border border-slate-800 rounded-3xl shadow-2xl">
        <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-blue-500/10 text-blue-400 text-2xl shadow-inner">
          🔒
        </div>
        
        <h2 className="text-xl font-bold text-slate-100">
          حریم خصوصی امن
        </h2>
        
        <p className="text-sm text-slate-400 leading-relaxed">
          به دلیل عدم تمرکز روی صفحه یا خروج از تب، محیط گفتگو به صورت موقت قفل شد تا محرمانه بماند.
        </p>

        <button
          onClick={handleUnlock}
          className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition shadow-lg shadow-blue-600/25 active:scale-95"
        >
          بازگشت به گفتگو
        </button>
      </div>
    </div>
  );
}