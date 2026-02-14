"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { AdminI18nProvider } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";

const adminLocales: Locale[] = ["en", "th"];

export default function AdminSidebarFooter() {
  return (
    <AdminI18nProvider>
      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-700">
          <LanguageSwitcher locales={adminLocales} />
          <ThemeToggle />
        </div>
        <div className="p-3">
          <form action="/api/auth/signout" method="POST">
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 font-medium"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sign Out
            </Button>
          </form>
        </div>
      </div>
    </AdminI18nProvider>
  );
}
