export function NavaLogo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <div className={`relative group cursor-pointer transition-transform duration-500 hover:scale-108 ${className}`}>
      {/* هاله نورانی و آرامش‌بخش عمیق‌تر در حالت هاور */}
      <div className="absolute inset-[-4px] bg-gradient-to-tr from-teal-500/30 to-emerald-400/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative w-full h-full drop-shadow-md group-hover:drop-shadow-2xl transition-all duration-500"
      >
        {/* بستر دایره‌ای مات و مینیمال (فضای امن تراپی) */}
        <circle
          cx="50"
          cy="50"
          r="45"
          className="fill-teal-500/10 dark:fill-teal-400/10 stroke-teal-500/30 dark:stroke-teal-400/30 transition-colors"
          strokeWidth="1.5"
        />

        {/* موج‌های حمایتی سیال (تلفیق حرف ن و آغوش امن امنیتی) */}
        <path
          d="M26 60C26 39 41 26 60 26C70 26 78 32 78 42C78 52 68 60 55 60C44 60 36 52 36 42"
          stroke="url(#therapyProGradient)"
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-500"
        />

        {/* موج مکمل زیرین برای القای عمق و ریتم تنفس */}
        <path
          d="M32 68C40 73 48 75 58 75"
          stroke="url(#therapyProGradient)"
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.5"
        />

        {/* هسته مرکزی تلفیق ذهن و قلب (نماد شفای روان و همدلی) */}
        <path
          d="M50 39C50 39 42 32 38 36C34 40 38 47 50 55C62 47 66 40 62 36C58 32 50 39 50 39Z"
          fill="url(#therapyProGradient)"
          className="transition-transform duration-500 group-hover:scale-115 origin-center"
        />

        {/* نقطه کانونی آگاهی در مرکز قلب/ذهن */}
        <circle
          cx="50"
          cy="43"
          r="2.5"
          className="fill-slate-950 dark:fill-slate-900 transition-transform duration-500 group-hover:scale-125"
        />

        <defs>
          <linearGradient
            id="therapyProGradient"
            x1="26"
            y1="26"
            x2="78"
            y2="75"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#2dd4bf" />
            <stop offset="0.5" stopColor="#14b8a6" />
            <stop offset="1" stopColor="#0d9488" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}