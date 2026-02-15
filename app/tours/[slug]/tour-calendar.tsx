"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Users, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/context";

interface BookingDate {
  tour_date: string;
  total_pax: number;
  booking_count: number;
}

interface Props {
  bookingDates: BookingDate[];
  slug: string;
}

const MAX_GROUP = 8;

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function TourCalendar({ bookingDates, slug }: Props) {
  const { t } = useI18n();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  // Build a map of date -> booking info
  const dateMap = new Map<string, BookingDate>();
  bookingDates.forEach((bd) => {
    dateMap.set(bd.tour_date, bd);
  });

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const monthName = new Date(currentYear, currentMonth).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Can't go before current month
  const canGoPrev =
    currentYear > today.getFullYear() ||
    (currentYear === today.getFullYear() && currentMonth > today.getMonth());

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          {t("tour.calendar_title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={prevMonth}
            disabled={!canGoPrev}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-sm">{monthName}</span>
          <Button variant="ghost" size="sm" onClick={nextMonth} className="h-8 w-8 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayNames.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 dark:text-muted-foreground py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before the 1st */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dateObj = new Date(currentYear, currentMonth, day);
            const isToday =
              day === today.getDate() &&
              currentMonth === today.getMonth() &&
              currentYear === today.getFullYear();
            const isPast = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const booking = dateMap.get(dateStr);
            const spotsUsed = booking?.total_pax || 0;
            const spotsLeft = MAX_GROUP - spotsUsed;
            const isFull = spotsLeft <= 0;

            return (
              <div
                key={day}
                className={`
                  relative h-10 rounded-md flex flex-col items-center justify-center text-sm transition-colors
                  ${isPast ? "text-gray-300 dark:text-gray-600" : ""}
                  ${isToday ? "ring-2 ring-primary ring-offset-1 dark:ring-offset-background font-bold" : ""}
                  ${!isPast && booking && !isFull ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400" : ""}
                  ${!isPast && isFull ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" : ""}
                  ${!isPast && !booking ? "hover:bg-gray-50 dark:hover:bg-secondary" : ""}
                `}
              >
                <span className="text-xs leading-none">{day}</span>
                {!isPast && booking && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <Users className="h-2 w-2" />
                    <span className="text-[9px] font-semibold leading-none">{spotsUsed}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t text-xs text-gray-500 dark:text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700" />
            <span>Has bookings</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700" />
            <span>Full</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded ring-2 ring-primary" />
            <span>{t("tour.calendar_today")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
