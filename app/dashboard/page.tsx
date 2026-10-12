import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { NavaLogo } from "@/app/components/NavaLogo";
import Link from "next/link";
import { LanguageSwitcher } from "@/app/components/LanguageSwitcher";
import { dictionary, Lang } from "@/lib/dictionary";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("nava_session")?.value;

  if (!userId) {
    redirect("/auth");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  // 🛑 بررسی مسدود بودن یا حذف شدن کاربر
  if (!user || user.isActive === false) {
    cookieStore.set({
      name: "nava_session",
      value: "",
      maxAge: 0,
      path: "/",
    });
    redirect("/auth?error=banned");
  }

  // دریافت زبان از کوکی برای همگام‌سازی کامل با سمت سرور
  const currentLang = (cookieStore.get("nava_lang")?.value as Lang) || "fa";
  const t = (key: keyof typeof dictionary.fa) => {
    return dictionary[currentLang][key] || dictionary["fa"][key] || key;
  };

  // بررسی وضعیت اشتراک زمانی فعال کاربر
  const now = new Date();
  const isSubscribed = Boolean(
    user?.isSubscribed && 
    user?.subscriptionExpiresAt && 
    new Date(user.subscriptionExpiresAt) > now
  );

  // محاسبه پویای تاریخ شروع، پایان و روزهای باقی‌مانده برای پکیج‌های ۱، ۳ و ۶ ماهه
  let remainingSubscriptionDays = 0;
  let formattedStartDate = "---";
  let formattedEndDate = "---";

  if (isSubscribed && user?.subscriptionExpiresAt) {
    const expireDate = new Date(user.subscriptionExpiresAt);
    const diffTime = expireDate.getTime() - now.getTime();
    
    // محاسبه دقیق روزهای باقی‌مانده تا انقضا
    remainingSubscriptionDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // تشخیص پویای نوع پکیج (۱ ماهه = ۳۰ روز، ۳ ماهه = ۹۰ روز، ۶ ماهه = ۱۸۰ روز)
    const packageDays = remainingSubscriptionDays <= 35 ? 30 : remainingSubscriptionDays <= 100 ? 90 : 180;
    
    // محاسبه دقیق تاریخ شروع با کسر دقیق تعداد روزهای پکیج
    const startDate = new Date(expireDate.getTime() - (packageDays * 24 * 60 * 60 * 1000));
    startDate.setDate(startDate.getDate() + 1);

    // فرمت کردن تاریخ شروع
    formattedStartDate = startDate.toLocaleDateString(currentLang === 'fa' ? 'fa-IR-u-nu-latn' : 'en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });

    // فرمت کردن تاریخ پایان
    formattedEndDate = expireDate.toLocaleDateString(currentLang === 'fa' ? 'fa-IR-u-nu-latn' : 'en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  }

  // محاسبه سهمیه باقی‌مانده رایگان (۵۰ پیام هدیه اولیه)
  const FREE_LIMIT = 50;
  const messageCount = user?.messageCount || 0;
  const remainingFree = Math.max(0, FREE_LIMIT - messageCount);

  // محاسبه درصد پیشرفت مصرف سهمیه رایگان
  const freeProgressPercent = Math.min(100, Math.round((messageCount / FREE_LIMIT) * 100));

  // بررسی دسترسی ادمین
  const isAdmin = user?.isAdmin || user?.role === 'ADMIN';

  // شرط تیکت‌های نیازمند بررسی برای ادمین
  
  const unresolvedTicketCondition = {
  status: { in: ["OPEN", "IN_PROGRESS"] },
  isRead: false 
  };

  // 🎯 شمارشگر تیکت‌های نیازمند توجه
  const pendingTicketsCount = isAdmin
    ? await prisma.ticket.count({ where: unresolvedTicketCondition }).catch(() => 0)
    : await prisma.ticket.count({ 
        where: { 
          userId: user.id, 
          hasUnreadResponse: true, 
          isRead: false            
        } 
      }).catch(() => 0);

  // 🎯 لیست تیکت‌های داشبورد
  const recentTickets = isAdmin
    ? await prisma.ticket.findMany({
        where: unresolvedTicketCondition,
        take: 4,
        orderBy: { updatedAt: 'desc' },
        include: { user: { select: { name: true, phone: true } } }
      }).catch(() => [])
    : await prisma.ticket.findMany({
        where: { 
          userId: user.id, 
          hasUnreadResponse: true,
          isRead: false 
        },
        take: 4,
        orderBy: { updatedAt: 'desc' }
      }).catch(() => []);

  return (
    <div className="min-h-screen bg-[#06080d] text-slate-100 font-sans p-4 md:p-8 selection:bg-teal-500 selection:text-slate-950 relative overflow-hidden">
      
      {/* نورپردازی پس‌‌زمینه پویا بر اساس سطح دسترسی */}
      <div className={`absolute top-0 right-1/4 w-[500px] h-[350px] ${isAdmin ? 'bg-indigo-500/10' : 'bg-teal-500/5'} blur-[140px] pointer-events-none rounded-full`}></div>
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[300px] bg-emerald-500/5 blur-[140px] pointer-events-none rounded-full"></div>

      <div className="max-w-6xl mx-auto space-y-6 relative z-10">
        
        {/* هدر هوشمند */}
        <header className="flex items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-2xl border border-slate-800/80 px-6 py-4 rounded-3xl shadow-2xl">
          <div className="flex items-center gap-3.5">
            <div className="relative group">
              <div className={`absolute -inset-1 bg-gradient-to-r ${isAdmin ? 'from-indigo-500 to-teal-500' : 'from-teal-500 to-emerald-500'} rounded-2xl blur opacity-30 group-hover:opacity-75 transition duration-500`}></div>
              <div className="relative bg-slate-950 p-2.5 rounded-2xl border border-slate-800 shadow-inner">
                <NavaLogo className="w-8 h-8 drop-shadow-md" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-slate-100 text-sm tracking-wide">
                  {isAdmin ? t("adminTitle") : t("dashboardTitle")}
                </h1>
                <span className={`text-[10px] ${isAdmin ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-teal-500/10 text-teal-400 border-teal-500/20'} border px-2 py-0.5 rounded-full font-mono font-semibold`}>
                  {isAdmin ? "Admin Control" : "v2.5 Pro"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {t("welcome")} <span className={`${isAdmin ? 'text-indigo-400' : 'text-teal-400'} font-medium`}>{user?.name || "User"}</span> {t("welcomeSuffix")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 🌐 دکمه تغییر زبان */}
            <LanguageSwitcher />

            <Link
              href="/profile"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-teal-400 transition-all shadow-sm backdrop-blur-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <span className="hidden sm:inline">{t("profile")}</span>
            </Link>

            <form
              action={async () => {
                "use server";
                const cookieStore = await cookies();
                cookieStore.set({
                  name: "nava_session",
                  value: "",
                  maxAge: 0,
                  path: "/",
                });
                redirect("/auth");
              }}
            >
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/30 text-xs text-slate-300 hover:text-red-400 transition-all cursor-pointer shadow-sm backdrop-blur-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 rotate-180">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>   
                <span className="hidden sm:inline">{t("logout")}</span>
              </button>
            </form>
          </div>
        </header>

        {/* ساختار Bento Grid مدرن */}
        <main className="grid grid-cols-1 md:grid-cols-12 gap-5">
          
          {/* کارت هیروی اصلی (ورود به چت) */}
          <div className="md:col-span-7 bg-gradient-to-br from-slate-900 via-slate-900/80 to-slate-950 border border-slate-800/80 p-7 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col justify-between group backdrop-blur-xl">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl group-hover:bg-teal-500/20 transition-all"></div>
            
            <div className="space-y-3 relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-400 text-[11px] font-semibold">
                {t("heroBadge")}
              </span>
              <h2 className="text-xl md:text-2xl font-black text-slate-100 tracking-tight">
                {t("heroHeading")}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                {t("heroDesc")}
              </p>
            </div>

            <div className="pt-6 relative z-10 flex flex-wrap items-center gap-3">
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-bold px-5 py-3 rounded-2xl transition-all shadow-lg shadow-teal-500/20 text-xs hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{t("chatButton")}</span>
                <span>←</span>
              </Link>
            </div>
          </div>

          {/* کارت وضعیت سهمیه رایگان / اشتراک */}
          <div className="md:col-span-5 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 p-6 rounded-3xl shadow-xl relative overflow-hidden flex flex-col justify-between group hover:border-teal-500/40 transition-all">
            <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl"></div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">{t("quotaStatus")}</span>
              <span className="p-2.5 bg-teal-500/10 text-teal-400 rounded-2xl text-sm border border-teal-500/20">⏳</span>
            </div>

            <div className="my-3">
              {isSubscribed ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-base font-black text-emerald-400 tracking-tight">
                      {t("activePro")} <span className="text-[10px] font-normal text-slate-400">{t("unlimited")}</span>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold rounded-xl font-mono">
                      {remainingSubscriptionDays} {t("daysLeft")}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-300 space-y-2 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 shadow-inner">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">{t("startDate")}</span>
                      <span className="font-mono font-medium text-slate-200 tracking-wider" dir="ltr">
                        {formattedStartDate}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">{t("endDate")}</span>
                      <span className="font-mono font-bold text-emerald-400 tracking-wider" dir="ltr">
                        {formattedEndDate}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-3xl font-black text-teal-400 tracking-tight mb-1">
                    {remainingFree} <span className="text-xs font-normal text-slate-400">{t("freeMessagesLeft")}</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800 mt-3 shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full transition-all duration-500 rounded-full" 
                      style={{ width: `${freeProgressPercent}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-900/80">
              <span>{isSubscribed ? t("unlimitedAccess") : t("freeTierDesc")}</span>
              <span className={isSubscribed ? "text-emerald-400 font-medium" : "text-teal-400 font-medium"}>
                {isSubscribed ? "Pro" : t("freeTier")}
              </span>
            </div>
          </div>

          {/* کارت اشتراک زمانی */}
          <div className="md:col-span-4 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 p-6 rounded-3xl shadow-xl relative overflow-hidden flex flex-col justify-between group hover:border-emerald-500/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">{t("subscriptionPackages")}</span>
              <span className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-2xl text-sm border border-emerald-500/20">⚡</span>
            </div>
            <div>
              <div className="text-lg font-black text-emerald-400 tracking-tight mb-2">
                {isSubscribed ? t("renewOrUpgrade") : t("buyUnlimited")}
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                {t("subscriptionDesc")}
              </p>
              <Link 
                href="/credit" 
                className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                <span>{t("viewSubscriptions")}</span>
                <span>←</span>
              </Link>
            </div>
          </div>

          {/* کارت سطح دسترسی */}
          <div className="md:col-span-4 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 p-6 rounded-3xl shadow-xl relative overflow-hidden flex flex-col justify-between group hover:border-indigo-500/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">{t("accessLevel")}</span>
              <span className="p-2.5 bg-indigo-500/10 text-indigo-400 border-indigo-500/20 rounded-2xl text-sm border">🔒</span>
            </div>
            <div>
              <div className="text-sm font-bold text-slate-200 mb-1 flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isAdmin ? 'bg-indigo-400' : 'bg-emerald-400'} animate-pulse`}></span>
                {isAdmin ? t("adminRole") : t("verifiedUser")}
              </div>
              <div className="text-[11px] text-slate-400">
                {isAdmin ? t("adminDesc") : t("userDesc")}
              </div>
            </div>
          </div>

          {/* ابزارهای سریع / پنل مدیریت ادمین */}
          <div className="md:col-span-4 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 p-5 rounded-3xl shadow-xl flex flex-col justify-between space-y-3">
            <span className="text-xs font-semibold text-slate-400 px-1">
              {isAdmin ? t("quickToolsAdmin") : t("quickToolsUser")}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/reports"
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-teal-400 transition-all shadow-inner"
              >
                <span>📊</span>
                <span>{t("reports")}</span>
              </Link>
              
              <Link
                href="/tickets"
                className="relative flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-teal-400 transition-all shadow-inner"
              >
                <span>💬</span>
                <span>{t("support")}</span>
                {pendingTicketsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-500 text-slate-950 font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow-md">
                    {pendingTicketsCount}
                  </span>
                )}
              </Link>

              {isAdmin && (
                <>
                  <Link
                    href="/admin/reports"
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-xs text-indigo-400 font-semibold transition-all shadow-inner"
                  >
                    <span>🛡️</span>
                    <span>{t("adminFinance")}</span>
                  </Link>
                  <Link
                    href="/admin/stats"
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-xs text-teal-400 font-semibold transition-all shadow-inner"
                  >
                    <span>👥</span>
                    <span>{t("manageUsers")}</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* تیکت‌ها و پیام‌ها */}
          <div className="md:col-span-7 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 p-7 rounded-3xl shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <span>🎫</span> {isAdmin ? t("ticketsAdminHeading") : t("ticketsUserHeading")}
              </h3>
              <Link href="/tickets" className="text-xs text-teal-400 hover:text-teal-300 font-semibold transition-colors">
                {t("allTickets")}
              </Link>
            </div>

            {recentTickets.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                {isAdmin ? t("noTicketsAdmin") : t("noTicketsUser")}
              </div>
            ) : (
              <div className="space-y-3">
                {recentTickets.map((ticket: any) => (
                  <form 
                    key={ticket.id}
                    action={async () => {
                      "use server";
                      await prisma.ticket.update({
                        where: { id: ticket.id },
                        data: { 
                          isRead: true,
                          hasUnreadResponse: false 
                        }
                      }).catch((err) => console.error("Update ticket error:", err));

                      redirect(`/tickets?id=${ticket.id}`);
                    }}
                  >
                    <button 
                      type="submit"
                      className="w-full text-right bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 hover:border-teal-500/40 transition-all flex items-center justify-between gap-3 group shadow-inner cursor-pointer"
                    >
                      <div className="space-y-1 overflow-hidden">
                        {isAdmin && (
                          <div className="text-[10px] text-indigo-400 font-medium flex items-center gap-1.5">
                            <span>{t("sender")}</span>
                            <span className="text-slate-200">{ticket.user?.name || t("unnamed")}</span>
                            <span className="text-slate-500">({ticket.user?.phone})</span>
                          </div>
                        )}
                        <h4 className="text-xs font-bold text-slate-200 group-hover:text-teal-400 transition-colors truncate">
                          {ticket.subject}
                        </h4>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {!isAdmin && ticket.hasUnreadResponse ? (
                          <span className="bg-emerald-500 text-slate-950 font-bold text-[10px] px-3 py-1 rounded-full animate-bounce shadow-lg">
                            {t("newAdminResponse")}
                          </span>
                        ) : (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {t("answered")}
                          </span>
                        )}
                      </div>
                    </button>
                  </form>
                ))}
              </div>
            )}
          </div>

          {/* اطلاعات حساب کاربری */}
          <div className="md:col-span-5 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 p-7 rounded-3xl shadow-2xl space-y-4">
            <div className="border-b border-slate-800/80 pb-3">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <span>📋</span> {t("userInfo")}
              </h3>
            </div>

            <div className="space-y-3 text-xs bg-slate-950/50 p-5 rounded-2xl border border-slate-800/80 shadow-inner">
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-900">
                <span className="text-slate-400">{t("nameLabel")}</span> 
                <span className="font-semibold text-slate-200">{user?.name || t("notRegistered")}</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-900">
                <span className="text-slate-400">{t("phoneLabel")}</span> 
                <span className="font-semibold text-teal-400 font-mono" dir="ltr">{user?.phone}</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-900">
                <span className="text-slate-400">{t("emailLabel")}</span> 
                <span className="font-semibold text-slate-200">{user?.email || t("notRegistered")}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">{t("idLabel")}</span> 
                <span className="font-mono text-[10px] text-slate-500">{user?.id.slice(0, 10)}...</span>
              </div>
            </div>
          </div>

        </main>

      </div>
    </div>
  );
}