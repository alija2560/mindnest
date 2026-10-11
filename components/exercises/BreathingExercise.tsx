"use client";

import React, { useState, useEffect } from "react";

export const BreathingExercise = () => {
  const [phase, setPhase] = useState<"دم (Inhale)" | "نگهداری (Hold)" | "بازدم (Exhale)">("دم (Inhale)");
  const [count, setCount] = useState(4);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setCount((prev) => {
        if (prev > 1) return prev - 1;

        if (phase === "دم (Inhale)") {
          setPhase("نگهداری (Hold)");
          return 7;
        } else if (phase === "نگهداری (Hold)") {
          setPhase("بازدم (Exhale)");
          return 8;
        } else {
          setPhase("دم (Inhale)");
          return 4;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, phase]);

  return (
    <div className="flex flex-col items-center justify-center p-8 max-w-md mx-auto bg-white dark:bg-[#18181B] rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-xs" dir="rtl">
      <h3 className="text-lg font-medium mb-1">تمرین تنفس ۴-۷-۸</h3>
      <p className="text-xs text-slate-500 mb-8">برای کاهش استرس و آرامش سیستم عصبی</p>

      <div
        className={`w-44 h-44 rounded-full flex items-center justify-center transition-all duration-1000 ${
          phase === "دم (Inhale)"
            ? "scale-110 bg-blue-50 dark:bg-blue-950/40 text-blue-600 border border-blue-200"
            : phase === "نگهداری (Hold)"
            ? "scale-110 bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-200"
            : "scale-95 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200"
        }`}
      >
        <div className="text-center">
          <span className="block text-sm font-medium mb-1">{phase}</span>
          <span className="text-3xl font-bold">{count}</span>
        </div>
      </div>

      <button
        onClick={() => {
          setIsActive(!isActive);
          setPhase("دم (Inhale)");
          setCount(4);
        }}
        className="mt-8 px-6 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full text-sm font-medium transition hover:opacity-90"
      >
        {isActive ? "توقف تمرین" : "شروع تمرین"}
      </button>
    </div>
  );
};