"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function IdleTimeout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(15);

  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const showWarningRef = useRef(false);
  showWarningRef.current = showWarning;

  const IDLE_TIME_LIMIT = 10 * 60 * 1000; // ۱۰ دقیقه فعالیت نکردن
  const WARNING_DURATION = 15;            // ۱۵ ثانیه مهلت در مدال هشدار

  const clearAllTimers = useCallback(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
  }, []);

  const logoutUser = useCallback(async () => {
    clearAllTimers();
    try {
      localStorage.clear();
      sessionStorage.clear();
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/auth?reason=timeout");
      router.refresh();
    } catch (error) {
      console.error("Auto logout error:", error);
    }
  }, [router, clearAllTimers]);

  const startTimers = useCallback(() => {
    if (pathname.startsWith("/auth")) return;

    clearAllTimers();
    setShowWarning(false);
    setCountdown(WARNING_DURATION);

    // ۱. تایمر ۱۰ دقیقه‌ای برای شروع هشدار
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      let timeLeft = WARNING_DURATION;
      setCountdown(timeLeft);

      // ۲. اینتروال معتبر برای کم کردن ثانیه‌ها به صورت دقیق
      countdownIntervalRef.current = setInterval(() => {
        timeLeft -= 1;
        setCountdown(timeLeft);

        if (timeLeft <= 0) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        }
      }, 1000);

      // ۳. تایمر دقیق ۱۵ ثانیه‌ای برای خروج اضطراری پس از پایان کامل شمارنده
      logoutTimerRef.current = setTimeout(() => {
        logoutUser();
      }, WARNING_DURATION * 1000);

    }, IDLE_TIME_LIMIT);
  }, [IDLE_TIME_LIMIT, WARNING_DURATION, logoutUser, clearAllTimers, pathname]);

  // دکمه "می‌خواهم بمانم"
  const stayLoggedIn = () => {
    clearAllTimers();
    setShowWarning(false);
    startTimers();
  };

  useEffect(() => {
    if (pathname.startsWith("/auth")) {
      clearAllTimers();
      return;
    }

    const handleUserActivity = () => {
      // اگر مدال هشدار باز نباشد، با حرکت کاربر تایمر ۱۰ دقیقه ریست می‌شود
      if (!showWarningRef.current) {
        startTimers();
      }
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];

    events.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    startTimers();

    return () => {
      clearAllTimers();
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [pathname, startTimers, clearAllTimers]);

  return (
    <>
      {children}

      {showWarning && !pathname.startsWith("/auth") && (
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