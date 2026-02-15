"use client";

import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, Route, CalendarDays, Users, Settings, QrCode, Contact, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { AdminI18nProvider, useI18n } from "@/lib/i18n/context";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Locale } from "@/lib/i18n/translations";

const adminLocales: Locale[] = ["en", "th"];

function SidebarContent({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: t("admin.dashboard") },
    { href: "/admin/bookings", icon: CalendarDays, label: t("admin.bookings") },
    { href: "/admin/check-in", icon: QrCode, label: t("admin.check_in") },
    { href: "/admin/customers", icon: Contact, label: t("admin.customers") },
    { href: "/admin/routes", icon: Route, label: t("admin.routes") },
    { href: "/admin/users", icon: Users, label: t("admin.users") },
    { href: "/admin/settings", icon: Settings, label: t("admin.email_settings") },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-60 bg-white dark:bg-card border-r border-gray-200 dark:border-border">
        <div className="p-5 border-b border-gray-200 dark:border-border">
          <Link href="/admin" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Mad Monkey eBike Tours"
              width={40}
              height={40}
              className="h-8 w-8 object-contain"
            />
            <span className="font-semibold text-sm text-gray-800 dark:text-foreground">Admin</span>
          </Link>
        </div>

        <nav className="px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-orange-50 dark:hover:bg-accent font-medium"
              >
                <item.icon className="h-4 w-4 mr-3" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-700">
            <LanguageSwitcher locales={adminLocales} />
            <ThemeToggle />
          </div>
          <div className="p-3">
            <form action="/api/auth/signout" method="POST">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="submit"
                    variant="ghost"
                    className="w-full justify-start text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 font-medium"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    {t("admin.sign_out")}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{t("tip.sign_out")}</TooltipContent>
              </Tooltip>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-60 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminI18nProvider>
      <SidebarContent>{children}</SidebarContent>
    </AdminI18nProvider>
  );
}
