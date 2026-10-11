"use client";

import React, { useState } from "react";
import { Send, Mic, AlertCircle } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
}

export const ChatInterface = ({ locale = "fa" }: { locale?: "fa" | "en" }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "assistant",
      text: locale === "fa" 
        ? "سلام. من نوا هستم. چطور می‌تونم امروز فضای آرومی برای افکارت بسازم؟" 
        : "Hello. I'm Nava. How can I help create a calmer space for your thoughts today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isCrisis, setIsCrisis] = useState(false);
  const [loading, setLoading] = useState(false);

  const suggestedPrompts = locale === "fa" ? [
    "احساس می‌کنم خیلی تحت فشارم",
    "نمی‌تونم افکارم رو خاموش کنم",
    "امروز روز سختی داشتم",
    "نیاز به انگیزه دارم"
  ] : [
    "I feel overwhelmed",
    "I can't stop overthinking",
    "I had a bad day",
    "I need help relaxing"
  ];

  // تابع handleSend که درخواست را به ای‌پی‌آی می‌فرستد
  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), sender: "user", text: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query, locale })
      });

      const data = await res.json();
      console.log("API Response:", data);

      if (data.isCrisis) {
        setIsCrisis(true);
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: data.response || "پاسخی دریافت نشد."
      };
      
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[85vh] max-w-3xl mx-auto p-4 bg-[#FAF9F6] dark:bg-[#18181B] text-[#27272A] dark:text-[#F4F4F5] rounded-2xl shadow-sm border border-[#E4E4E7] dark:border-[#27272A]" dir="rtl">
      
      {isCrisis && (
        <div className="p-4 mb-4 bg-amber-50 dark:bg-amber-950/40 border-r-4 border-amber-500 rounded text-amber-900 dark:text-amber-200 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 text-amber-600 shrink-0" />
          <div>
            <p className="font-semibold">حمایت فوری</p>
            <p className="mt-1">اگر در وضعیت خطرناک یا بحران روحی شدید هستید، لطفاً با ۱۲۳ (اورژانس اجتماعی) یا ۱۴۸۰ (صدای مشاور) تماس بگیرید.</p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 p-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                msg.sender === "user"
                  ? "bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 rounded-bl-none"
                  : "bg-white dark:bg-[#202023] border border-[#E4E4E7] dark:border-[#27272A] rounded-br-none shadow-xs"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-[#202023] p-3 rounded-2xl text-xs text-slate-400 animate-pulse">
              نوا در حال شنیدن است...
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto py-2 scrollbar-none">
        {suggestedPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            className="text-xs bg-white dark:bg-[#202023] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-1.5 rounded-full whitespace-nowrap transition"
          >
            {p}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
        <button
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition"
          title="ورودی صوتی"
        >
          <Mic className="w-5 h-5" />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="چی تو ذهنته؟ اینجا بنویس..."
          className="flex-1 bg-transparent border-none focus:outline-hidden text-sm p-2"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim()}
          className="p-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full disabled:opacity-40 transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};