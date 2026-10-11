"use client";

import React, { useState } from "react";
import { BookOpen, Plus, Sparkles, Trash2 } from "lucide-react";

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
}

export const JournalView = ({ locale = "fa" }: { locale?: "fa" | "en" }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([
    {
      id: "1",
      title: "افکار امروز",
      content: "امروز احساس سبک‌تری داشتم، انگار پیاده‌روی صبحگاهی خیلی کمک کرد تا ذهنم مرتب بشه.",
      date: "۱۴۰۵/۰۵/۲۹"
    }
  ]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isWriting, setIsWriting] = useState(false);

  const handleSave = () => {
    if (!content.trim()) return;

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      title: title.trim() || (locale === "fa" ? "یادداشت بدون عنوان" : "Untitled Entry"),
      content: content.trim(),
      date: new Date().toLocaleDateString("fa-IR")
    };

    setEntries([newEntry, ...entries]);
    setTitle("");
    setContent("");
    setIsWriting(false);
  };

  const handleDelete = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-[#18181B] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs" dir="rtl">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          <h2 className="text-lg font-medium text-slate-800 dark:text-slate-100">دفترچه افکار و یادداشت‌ها</h2>
        </div>
        {!isWriting && (
          <button
            onClick={() => setIsWriting(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full text-xs font-medium transition hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            <span>نوشتن یادداشت جدید</span>
          </button>
        )}
      </div>

      {/* Writing Form */}
      {isWriting ? (
        <div className="space-y-4 mb-8 p-4 bg-slate-50 dark:bg-[#202023] rounded-xl border border-slate-200 dark:border-slate-800">
          <input
            type="text"
            placeholder="عنوان یادداشت (اختیاری)..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent border-b border-slate-200 dark:border-slate-700 pb-2 text-sm focus:outline-hidden font-medium"
          />
          <textarea
            placeholder="امروز چه چیزی ذهنت رو درگیر کرده؟ آزادانه بنویس..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="w-full bg-transparent border-none text-sm focus:outline-hidden resize-none leading-relaxed"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsWriting(false)}
              className="px-4 py-2 text-xs text-slate-500 hover:text-slate-700 transition"
            >
              انصراف
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full text-xs font-medium transition"
            >
              ذخیره یادداشت
            </button>
          </div>
        </div>
      ) : null}

      {/* Entries List */}
      <div className="space-y-4">
        {entries.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-8">هنوز یادداشتی ثبت نکرده‌ای. از دکمه بالا شروع کن.</p>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="p-4 bg-slate-50/50 dark:bg-[#202023]/50 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2 group transition hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200">{entry.title}</h4>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400">{entry.date}</span>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-slate-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                    title="حذف یادداشت"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                {entry.content}
              </p>
            </div>
          ))
        )}
      </div>

    </div>
  );
};