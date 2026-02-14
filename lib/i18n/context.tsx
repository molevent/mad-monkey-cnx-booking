"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Locale } from "./translations";
import { bookingTranslations, adminTranslations } from "./translations";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: "en",
  setLocale: () => {},
  t: (key: string) => key,
});

export function useI18n() {
  return useContext(I18nContext);
}

export function BookingI18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = localStorage.getItem("booking-locale") as Locale | null;
    if (saved && ["en", "th", "cn", "jp"].includes(saved)) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("booking-locale", l);
  }, []);

  const t = useCallback(
    (key: string) => bookingTranslations[locale]?.[key] || bookingTranslations.en[key] || key,
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function AdminI18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = localStorage.getItem("admin-locale") as Locale | null;
    if (saved && ["en", "th"].includes(saved)) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("admin-locale", l);
  }, []);

  const t = useCallback(
    (key: string) => {
      const adminLocale = locale === "th" ? "th" : "en";
      return adminTranslations[adminLocale]?.[key] || adminTranslations.en[key] || key;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}
