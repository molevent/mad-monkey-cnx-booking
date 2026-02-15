"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  CalendarDays,
  X,
  Clock,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStatusColor, getStatusLabel, formatTime } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";

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

interface DateSummary {
  total_pax: number;
  booking_count: number;
  bookings: CalendarBooking[];
}

interface Props {
  bookings: CalendarBooking[];
}

const MAX_GROUP = 8;

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function DashboardCalendar({ bookings }: Props) {
  const { t } = useI18n();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  // Build date map
  const dateMap = new Map<string, DateSummary>();
  bookings.forEach((b) => {
    const existing = dateMap.get(b.tour_date) || {
      total_pax: 0,
      booking_count: 0,
      bookings: [],
    };
    existing.total_pax += b.pax_count;
    existing.booking_count += 1;
    existing.bookings.push(b);
    dateMap.set(b.tour_date, existing);
  });

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate(null);
  };

  const monthName = new Date(currentYear, currentMonth).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const selectedBookings = selectedDate ? dateMap.get(selectedDate) : null;

  const formatSelectedDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          {t("admin.booking_calendar")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={prevMonth} className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold">{monthName}</span>
          <Button variant="ghost" size="sm" onClick={nextMonth} className="h-8 w-8 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayNames.map((d) => (
            <div
              key={d}
              className="text-center text-xs font-medium text-gray-400 dark:text-muted-foreground py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-14" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isToday =
              day === today.getDate() &&
              currentMonth === today.getMonth() &&
              currentYear === today.getFullYear();
            const summary = dateMap.get(dateStr);
            const hasBookings = summary && summary.booking_count > 0;
            const isSelected = selectedDate === dateStr;

            return (
              <button
                key={day}
                onClick={() => {
                  if (hasBookings) {
                    setSelectedDate(isSelected ? null : dateStr);
                  }
                }}
                className={`
                  relative h-14 rounded-lg flex flex-col items-center justify-center text-sm transition-all
                  ${isToday ? "ring-2 ring-primary ring-offset-1 dark:ring-offset-background" : ""}
                  ${isSelected ? "bg-primary text-white shadow-md" : ""}
                  ${!isSelected && hasBookings ? "bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 cursor-pointer" : ""}
                  ${!isSelected && !hasBookings ? "hover:bg-gray-50 dark:hover:bg-secondary text-gray-600 dark:text-gray-400" : ""}
                `}
              >
                <span className={`text-xs font-medium ${isToday && !isSelected ? "text-primary font-bold" : ""}`}>
                  {day}
                </span>
                {hasBookings && (
                  <div className={`flex items-center gap-0.5 mt-0.5 ${isSelected ? "text-white" : "text-primary"}`}>
                    <Users className="h-2.5 w-2.5" />
                    <span className="text-[10px] font-bold leading-none">{summary.total_pax}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t text-xs text-gray-500 dark:text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700" />
            <span>{t("admin.has_bookings")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded ring-2 ring-primary" />
            <span>{t("admin.today")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3 w-3" />
            <span>{t("admin.total_riders")}</span>
          </div>
        </div>

        {/* Selected Date Details */}
        {selectedDate && selectedBookings && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">
                {formatSelectedDate(selectedDate)}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setSelectedDate(null)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="flex items-center gap-3 mb-3 text-xs text-gray-500 dark:text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {selectedBookings.total_pax} {t("admin.riders")}
              </span>
              <span>{selectedBookings.booking_count} {t("admin.bookings")}</span>
            </div>

            <div className="space-y-2">
              {selectedBookings.bookings.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/admin/bookings/${booking.id}`}
                  className="block p-3 rounded-lg border border-gray-200 dark:border-border hover:border-primary/40 hover:bg-orange-50/50 dark:hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{booking.customer_name}</p>
                      <p className="text-xs text-gray-500 dark:text-muted-foreground truncate">
                        {booking.customer_email}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {booking.route_title}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(booking.start_time)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {booking.pax_count}
                        </span>
                      </div>
                    </div>
                    <Badge className={`shrink-0 ml-2 text-[10px] ${getStatusColor(booking.status)}`}>
                      {getStatusLabel(booking.status)}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
