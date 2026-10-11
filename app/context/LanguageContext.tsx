"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { Lang } from "@/lib/dictionary";

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ 
  children, 
  defaultLang = "fa" 
}: { 
  children: React.ReactNode; 
  defaultLang?: Lang 
}) {
  const [lang, setLangState] = useState<Lang>(defaultLang);

  useEffect(() => {
    const savedLang = localStorage.getItem("nava_lang") as Lang;
    if (savedLang && (savedLang === "fa" || savedLang === "en")) {
      setLangState(savedLang);
      document.documentElement.dir = savedLang === "fa" ? "rtl" : "ltr";
      document.documentElement.lang = savedLang;
    }
  }, []);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem("nava_lang", newLang);
    document.documentElement.dir = newLang === "fa" ? "rtl" : "ltr";
    document.documentElement.lang = newLang;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLang must be used within a LanguageProvider");
  }
  return context;
};