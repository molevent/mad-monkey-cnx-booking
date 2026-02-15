"use client";

import { useI18n } from "@/lib/i18n/context";

export default function SettingsHeader() {
  const { t } = useI18n();

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold">{t("admin.email_settings")}</h1>
      <p className="text-gray-500 dark:text-muted-foreground mt-1">
        {t("admin.settings_desc")}
      </p>
    </div>
  );
}
