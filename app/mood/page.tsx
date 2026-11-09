"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { NavaLogo } from "@/app/components/NavaLogo";

interface MoodItem {
  id: string;
  mood: number;
  energy: number;
  stress: number;
  sleep: number;
  note: string;
  createdAt: string;
}

interface ChatMessage {
  content: string;
  role: string;
  createdAt?: string;
}

const scaleOptions = [
  { value: 1, label: "بسیار کم / بحرانی", color: "from-rose-600 to-red-700" },
  { value: 2, label: "کم / ضعیف", color: "from-amber-600 to-orange-700" },
  { value: 3, label: "متوسط / خنثی", color: "from-yellow-600 to-amber-600" },
  { value: 4, label: "خوب / مطلوب", color: "from-teal-500 to-emerald-600" },
  { value: 5, label: "عالی / فوق‌العاده", color: "from-emerald-400 to-cyan-500" },
];

export default function TherapeuticMoodPage() {
  const router = useRouter();
  const [moods, setMoods] = useState<MoodItem[]>([]);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  
  const [mood, setMood] = useState<number>(4);
  const [energy, setEnergy] = useState<number>(4);
  const [stress, setStress] = useState<number>(2);
  const [sleep, setSleep] = useState<number>(4);
  const [note, setNote] = useState("");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/user/mood", { credentials: "include", cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setMoods(data.moods || []);
        setChats(data.recentChats || []);
      } else if (res.status === 401) {
        router.push("/login");
      }
    } catch (err) {
      console.error("Failed to fetch therapeutic data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/user/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mood, energy, stress, sleep, note }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({ type: "success", text: "ارزیابی ثبت شد و تحلیل درمانی گفتگوهای شما به‌روزرسانی گردید ✨" });
        setNote("");
        fetchData();
      } else {
        setFeedback({ type: "error", text: data.message || "خطا در ثبت اطلاعات." });
      }
    } catch (err) {
      setFeedback({ type: "error", text: "خطا در ارتباط با سرور." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const recentWeek = moods.slice(0, 7);
  const avgCurrentStress = recentWeek.length ? (recentWeek.reduce((acc, curr) => acc + curr.stress, 0) / recentWeek.length).toFixed(1) : "0";

  const getTherapeuticSynthesis = () => {
    const userMessages = chats.filter(c => c.role === "user");
    
    if (userMessages.length === 0) {
      return {
        badge: "در انتظار شروع فرآیند مشاوره",
        title: "هنوز گفتگویی در پرونده ثبت نشده است",
        description: "برای اینکه نوا بتواند به عنوان یک مشاور، ساختار ذهنی و چالش‌های شما را ریشه‌یابی کند، لازم است ابتدا در بخش گفتگو با هم صحبت کنیم.",
        actionSteps: [
          "ورود به اتاق گفتگو با نوا",
          "اشتراک‌‌گذاری دغدغه‌ها یا چالش‌های این روزها"
        ]
      };
    }

    const isHighStress = Number(avgCurrentStress) >= 3.5;

    return {
      badge: "سنتز کلینیکی و تحلیل جامع جلسات گفتگو",
      title: "ارزیابی عمیق وضعیت روانی و ریشه‌یابی چالش‌ها",
      description: `برآیند گفتگوهای اخیر شما در کنار نمره استرس ثبت‌شده (${avgCurrentStress} از ۵)، نشان می‌دهد که نیازمند یک رویکرد حمایتی و ساختاریافته برای بازگرداندن تعادل هستید.`,
      actionSteps: isHighStress ? [
        "ایجاد فواصل زمانیِ تنفس آگاهانه (Micro-breaks) در میان ساعات کاری فشرده",
        "تمرکز روی یک اولویت منفرد در هر بازه زمانی به جای چندوظیفگی (Multitasking)",
        "طرح موضوع فشار کاری یا ذهنی در جلسه بعدی گفتگو با نوا"
      ] : [
        "حفظ ریتم فعلی و استمرار در ثبت چک‌پوینت‌های روزانه",
        "استفاده از این بازه پرانرژی برای پیشبرد پروژه‌ها با تمرکز بالا",
        "تداوم گفتگوی سازنده با نوا جهت تثبیت عادت‌های ذهنی مثبت"
      ]
    };
  };

  const therapy = getTherapeuticSynthesis();

  return (
    <div dir="rtl" className="min-h-[100dvh] bg-[#030508] text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950 overflow-x-hidden w-full max-w-full">
      
      {/* نورهای پس‌زمینه فیکس‌شده برای موبایل */}
      <div className="fixed top-0 right-1/4 w-[250px] sm:w-[700px] h-[250px] sm:h-[700px] bg-teal-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="fixed bottom-10 left-1/4 w-[250px] sm:w-[700px] h-[250px] sm:h-[700px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* هدر کاملاً ریسپانسیو */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-8 py-3.5 bg-slate-900/60 backdrop-blur-2xl border-b border-slate-800/80 sticky top-0 z-50">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-2 bg-gradient-to-br from-teal-500/20 to-emerald-500/10 border border-teal-500/30 rounded-xl shadow-lg shrink-0">
            <NavaLogo className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-xs sm:text-sm text-white tracking-wide truncate">مرکز پایش و مشاوره تخصصی نوا</h1>
            <p className="text-[10px] text-slate-400 truncate">تحلیل عمیق بالینی و راهنمایی فردی</p>
          </div>
        </div>
        <button
          onClick={() => router.push("/chat")}
          className="w-full sm:w-auto bg-slate-800/90 hover:bg-slate-800 text-teal-400 border border-teal-500/30 px-4 py-2 rounded-xl text-xs transition-all font-medium flex items-center justify-center gap-2 cursor-pointer shadow-md shrink-0"
        >
          <span>💬 ورود به اتاق گفتگو با نوا</span>
        </button>
      </header>

      {/* محتوای اصلی */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-8 space-y-4 sm:space-y-8 relative z-10 box-border">
        
        {/* پنل سنتز کلینیکی */}
        <div className="bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-slate-950 border border-teal-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl space-y-4 backdrop-blur-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 sm:w-2 h-full bg-gradient-to-b from-teal-400 via-emerald-400 to-indigo-500"></div>

          <div>
            <span className="text-[9px] sm:text-[10px] font-mono text-teal-400 uppercase tracking-widest bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/20 inline-block mb-2">
              {therapy.badge}
            </span>
            <h2 className="text-sm sm:text-xl font-bold text-white tracking-wide">{therapy.title}</h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light bg-slate-950/60 p-3.5 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-800/80 shadow-inner">
            {therapy.description}
          </p>

          <div className="space-y-2 pt-1">
            <h3 className="text-xs font-bold text-teal-300 flex items-center gap-2">
              <span>🩺</span> نسخه و گام‌های پیشنهادی مشاوره‌ای:
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {therapy.actionSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-xs text-slate-200">
                  <span className="w-4.5 h-4.5 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {feedback && (
          <div className={`p-3.5 rounded-xl text-xs font-medium border ${feedback.type === "success" ? "bg-teal-500/10 border-teal-500/30 text-teal-300" : "bg-rose-500/10 border-rose-500/30 text-rose-300"}`}>
            {feedback.text}
          </div>
        )}

        {/* فرم ثبت ارزیابی روزانه */}
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800/80 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl space-y-5">
          <div>
            <h3 className="text-sm sm:text-lg font-bold text-white mb-0.5">ثبت چک‌پوینت ارزیابی امروز</h3>
            <p className="text-[11px] sm:text-xs text-slate-400">ثبت این داده‌ها به مشاور هوشمند شما کمک می‌کند تصویر دقیق‌تری داشته باشد.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <MetricSelector title="😊 حالت روحی کلی امروز" value={mood} onChange={setMood} />
            <MetricSelector title="⚡ سطح انرژی و شادابی جسمی" value={energy} onChange={setEnergy} />
            <MetricSelector title="🌊 میزان آرامش در برابر استرس" value={stress} onChange={setStress} />
            <MetricSelector title="💤 کیفیت استراحت و خواب دیشب" value={sleep} onChange={setSleep} />

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium block">یادداشت تخصصی یا چکیده افکار امروز (اختیاری):</label>
              <textarea
                maxLength={500}
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="چالش‌ها یا دستاوردهایی که دوست دارید در پرونده ثبت شود..."
                className="w-full bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 rounded-xl p-3 text-xs focus:border-teal-500 outline-none resize-none shadow-inner transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-400 hover:opacity-90 text-slate-950 font-bold py-3.5 rounded-xl text-xs transition-all shadow-lg shadow-teal-500/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                  <span>در حال سنتز اطلاعات...</span>
                </>
              ) : (
                <span>✨ ثبت ارزیابی و سنتز مجدد جلسات</span>
              )}
            </button>
          </form>
        </div>

        {/* آرشیو تاریخچه */}
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800/80 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl space-y-4">
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <span>📖</span> آرشیو تاریخچه پایش‌ها
          </h3>
          
          {isLoading ? (
            <div className="text-center py-8 text-xs text-slate-500">در حال بارگذاری اطلاعات...</div>
          ) : moods.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
              هنوز رکوردی ثبت نشده است.
            </div>
          ) : (
            <div className="space-y-2.5">
              {moods.map((item) => (
                <div key={item.id} className="p-3.5 sm:p-5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2.5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2">
                    <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 font-mono text-slate-300 w-full sm:w-auto text-[11px] sm:text-xs">
                      <span>حال: <b className="text-teal-400">{item.mood}/5</b></span>
                      <span>انرژی: <b className="text-amber-400">{item.energy}/5</b></span>
                      <span>استرس: <b className="text-rose-400">{item.stress}/5</b></span>
                      <span>خواب: <b className="text-indigo-400">{item.sleep}/5</b></span>
                    </div>
                    <span className="text-[10px] text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg font-mono self-end sm:self-auto">
                      {new Date(item.createdAt).toLocaleDateString("fa-IR")}
                    </span>
                  </div>
                  {item.note && <div className="text-xs text-slate-300 pt-2.5 border-t border-slate-900/80 font-light leading-relaxed">{item.note}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

function MetricSelector({ title, value, onChange }: { title: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="bg-slate-950/60 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-800/80 space-y-2.5">
      <div className="flex justify-between items-center text-xs font-medium text-slate-200">
        <span>{title}</span>
        <span className="text-teal-400 font-mono font-bold bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20 text-[11px]">
          امتیاز: {value}/5
        </span>
      </div>
      {/* چیدمان کاملاً ریسپانسیو و بهینه برای موبایل (۳ ستون در بالا و ۲ ستون در پایین برای عدم فشردگی کلمات) */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2">
        {scaleOptions.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`py-2.5 px-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex flex-col items-center justify-center gap-1 border ${
                isSelected
                  ? `bg-gradient-to-br ${opt.color} text-slate-950 font-bold border-white/50 shadow-lg scale-[1.02]`
                  : `bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200`
              }`}
            >
              <span className="text-sm sm:text-base font-mono font-bold">{opt.value}</span>
              <span className="text-[9px] sm:text-[10px] opacity-90 truncate w-full text-center px-0.5">{opt.label.split('/')[0].trim()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}