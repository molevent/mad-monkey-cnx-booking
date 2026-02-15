"use client";

import Link from "next/link";
import { CalendarDays, Route, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import DashboardCalendar from "./dashboard-calendar";
import type { Booking } from "@/lib/types";

interface CalendarBooking {
  id: string;
  customer_name: string;
  customer_email: string;
  tour_date: string;
  start_time: string;
  pax_count: number;
  status: string;
  route_title: string;
}

interface Props {
  stats: {
    totalBookings: number;
    pendingBookings: number;
    confirmedBookings: number;
    totalRoutes: number;
  };
  recentBookings: Booking[];
  calendarBookings: CalendarBooking[];
}

export default function DashboardContent({ stats, recentBookings, calendarBookings }: Props) {
  const { t } = useI18n();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{t("admin.dashboard")}</h1>
        <div className="flex gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/admin/routes">
                <Button>
                  <Route className="h-4 w-4 mr-2" />
                  {t("admin.manage_routes")}
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>{t("tip.manage_routes")}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-white dark:bg-card border border-gray-200 dark:border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase tracking-wide">
              {t("admin.total_bookings")}
            </CardTitle>
            <div className="p-2 bg-orange-50 rounded-lg">
              <CalendarDays className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalBookings}</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card border border-gray-200 dark:border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase tracking-wide">
              {t("admin.pending_review")}
            </CardTitle>
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{stats.pendingBookings}</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card border border-gray-200 dark:border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase tracking-wide">
              {t("admin.confirmed")}
            </CardTitle>
            <div className="p-2 bg-orange-50 rounded-lg">
              <CheckCircle className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{stats.confirmedBookings}</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card border border-gray-200 dark:border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase tracking-wide">
              {t("admin.active_routes")}
            </CardTitle>
            <div className="p-2 bg-gray-100 dark:bg-secondary rounded-lg">
              <Route className="h-4 w-4 text-gray-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalRoutes}</p>
          </CardContent>
        </Card>
      </div>

      {/* Booking Calendar */}
      <div className="mb-8">
        <DashboardCalendar bookings={calendarBookings} />
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("admin.recent_bookings")}</CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/admin/bookings">
                <Button variant="outline" size="sm">{t("admin.view_all")}</Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>{t("tip.view_all")}</TooltipContent>
          </Tooltip>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <p className="text-gray-500 dark:text-muted-foreground text-center py-8">{t("admin.no_bookings_yet")}</p>
          ) : (
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 bg-white dark:bg-card border border-gray-100 dark:border-border rounded-lg hover:border-orange-200 dark:hover:border-primary/30 transition-colors"
                >
                  <div>
                    <p className="font-semibold">{booking.customer_name}</p>
                    <p className="text-sm text-gray-500 dark:text-muted-foreground">
                      {booking.route?.title} • {formatDate(booking.tour_date)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-muted-foreground">
                      {booking.pax_count} {t("admin.riders")}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(booking.status)}>
                      {getStatusLabel(booking.status)}
                    </Badge>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href={`/admin/bookings/${booking.id}`}>
                          <Button variant="ghost" size="sm" className="mt-2">
                            {t("admin.view_details")}
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>{t("tip.view_details")}</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
