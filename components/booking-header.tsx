"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { bookingLocales } from "@/lib/i18n/translations";

export function BookingHeader() {
  return (
    <div className="flex items-center justify-end gap-1 py-2 px-4">
      <LanguageSwitcher locales={bookingLocales} />
      <ThemeToggle />
    </div>
  );
}
