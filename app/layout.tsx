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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "نوا",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#06080d" />
      </head>
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