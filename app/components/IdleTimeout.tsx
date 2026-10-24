"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function IdleTimeout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(15);

  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // تنظیم روی ۱۰ دقیقه (10 دقیقه * 60 ثانیه * 1000 میلی‌ثانیه)
  const IDLE_TIME_LIMIT = 10 * 60 * 1000; 
  const WARNING_DURATION = 15 * 1000; // ۱۵ ثانیه زمان هشدار

  const logoutUser = useCallback(async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/auth?reason=timeout"); // استفاده از replace برای جلوگیری از برگشت با Back
      router.refresh();
    } catch (error) {
      console.error("Auto logout error:", error);
    }
  }, [router]);

  const clearAllTimers = () => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  };

  const startTimers = useCallback(() => {
    clearAllTimers();
    setShowWarning(false);
    setCountdown(15);

    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);

      let timeLeft = 15;
      setCountdown(timeLeft);

      countdownIntervalRef.current = setInterval(() => {
        timeLeft -= 1;
        setCountdown(timeLeft);
        if (timeLeft <= 0) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        }
      }, 1000);

      logoutTimerRef.current = setTimeout(() => {
        logoutUser();
      }, WARNING_DURATION);

    }, IDLE_TIME_LIMIT);
  }, [IDLE_TIME_LIMIT, WARNING_DURATION, logoutUser]);

  const handleUserActivity = useCallback(() => {
    // اگر مدال هشدار باز نیست، با هر فعالیت کاربر تایمر از نو شروع شود
    if (!showWarning) {
      startTimers();
    }
  }, [showWarning, startTimers]);

  const stayLoggedIn = () => {
    startTimers(); 
  };

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];

    events.forEach((event) => {
      window.addEventListener(event, handleUserActivity);
    });

    startTimers();

    return () => {
      clearAllTimers();
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [handleUserActivity, startTimers]);

  return (
    <>
      {children}

      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 bg-[#0d1117] border border-slate-800 rounded-2xl shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 mx-auto flex items-center justify-center rounded-full bg-amber-500/10 text-amber-500 font-bold text-xl">
              ⚠️
            </div>
            
            <h3 className="text-lg font-bold text-slate-100">
              هشدار عدم فعالیت
            </h3>
            
            <p className="text-sm text-slate-400">
              شما به مدت طولانیست که با سامانه کار نکرده‌اید. برای حفظ امنیت، تا{" "}
              <span className="text-amber-400 font-semibold">{countdown} ثانیه</span> دیگر از سیستم خارج خواهید شد.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={logoutUser}
                className="flex-1 px-4 py-2 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
              >
                خروج الآن
              </button>
              
              <button
                onClick={stayLoggedIn}
                className="flex-1 px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition shadow-lg shadow-emerald-600/20"
              >
                می‌خواهم بمانم
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}