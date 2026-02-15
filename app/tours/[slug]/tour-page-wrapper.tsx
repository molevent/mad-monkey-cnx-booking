"use client";

import { BookingI18nProvider } from "@/lib/i18n/context";
import { BookingHeader } from "@/components/booking-header";

export default function TourPageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <BookingI18nProvider>
      <BookingHeader />
      {children}
    </BookingI18nProvider>
  );
}
