import { cookies } from "next/headers";
import { LanguageProvider } from "@/app/context/LanguageContext";
import { Lang } from "@/lib/dictionary";
import IdleTimeout from "./components/IdleTimeout";
import PrivacyShield from "./components/PrivacyShield";
import PreventBackCache from "./components/PreventBackCache";
import "./globals.css";

export const metadata = {
  title: "نوا | دستیار هوشمند",
  description: "سیستم هوشمند مدیریت و گفتگو",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const currentLang = (cookieStore.get("nava_lang")?.value as Lang) || "fa";
  const direction = currentLang === "fa" ? "rtl" : "ltr";

  return (
    <html lang={currentLang} dir={direction} suppressHydrationWarning>
      <body className="bg-[#06080d] text-slate-100 font-sans antialiased">
        <LanguageProvider defaultLang={currentLang}>
          <IdleTimeout>
            <PrivacyShield />
            <PreventBackCache />
            {children}
          </IdleTimeout>
        </LanguageProvider>
      </body>
    </html>
  );
}