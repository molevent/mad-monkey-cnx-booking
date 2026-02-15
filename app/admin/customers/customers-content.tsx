"use client";

import Link from "next/link";
import { Contact, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/context";
import type { Customer } from "@/lib/types";

interface Props {
  customers: Customer[];
}

export default function CustomersContent({ customers }: Props) {
  const { t } = useI18n();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">{t("admin.customers")}</h1>
          <p className="text-sm text-gray-500 dark:text-muted-foreground mt-1">
            {customers.length} {t("admin.customers").toLowerCase()}
          </p>
        </div>
      </div>

      {customers.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Contact className="h-12 w-12 text-gray-300 dark:text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-1">{t("admin.no_customers")}</h3>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white dark:bg-card rounded-lg border border-gray-200 dark:border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-secondary border-b border-gray-200 dark:border-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase">{t("admin.customer")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase">{t("admin.contact")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase">{t("admin.passport")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase">{t("admin.nationality")}</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase">{t("admin.total_bookings_col")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase">{t("admin.last_booking")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase">{t("admin.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-border">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-secondary">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 dark:text-foreground">{customer.full_name}</div>
                    <div className="text-xs text-gray-500 dark:text-muted-foreground">{customer.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    {customer.whatsapp ? (
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                        <Phone className="h-3 w-3" />
                        {customer.whatsapp}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {customer.passport_no || <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {customer.nationality || <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="secondary" className="font-mono">
                      {customer.total_bookings}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300" suppressHydrationWarning>
                    {customer.last_booking_at
                      ? new Date(customer.last_booking_at).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      {t("admin.view")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
