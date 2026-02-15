import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getEmailSettings } from "@/app/actions/email-settings";
import { BookingI18nProvider } from "@/lib/i18n/context";
import TrackingClient from "./tracking-client";
import type { Booking } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const LOGO_URL = "/logo.png";

export const metadata: Metadata = {
  title: "Track Your Booking",
  description: "Track the status of your Mad Monkey eBike tour booking. View payment details and booking confirmation.",
  openGraph: {
    title: "Track Your Booking | Mad Monkey eBike Tours",
    description: "Track the status of your Mad Monkey eBike tour booking in Chiang Mai.",
    images: [{ url: LOGO_URL, width: 800, height: 600, alt: "Mad Monkey eBike Tours" }],
  },
  twitter: {
    card: "summary",
    title: "Track Your Booking | Mad Monkey eBike Tours",
    description: "Track the status of your Mad Monkey eBike tour booking in Chiang Mai.",
    images: [LOGO_URL],
  },
  robots: { index: false, follow: false },
};

async function getBooking(token: string): Promise<Booking | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, route:routes(*)")
    .eq("tracking_token", token)
    .single();

  if (error) {
    console.error("Error fetching booking:", error);
    return null;
  }

  return data;
}

export default async function TrackingPage({
  params,
}: {
  params: { token: string };
}) {
  const booking = await getBooking(params.token);

  if (!booking) {
    notFound();
  }

  const showPaymentForm = booking.status === "AWAITING_PAYMENT";
  const emailSettings = showPaymentForm ? await getEmailSettings() : null;

  const bankInfo = emailSettings ? {
    bank_name: emailSettings.bank_name,
    bank_account_name: emailSettings.bank_account_name,
    bank_account_number: emailSettings.bank_account_number,
    bank_swift_code: emailSettings.bank_swift_code,
  } : undefined;

  return (
    <BookingI18nProvider>
      <TrackingClient
        booking={{
          id: booking.id,
          status: booking.status,
          tour_date: booking.tour_date,
          start_time: booking.start_time,
          customer_name: booking.customer_name,
          pax_count: booking.pax_count,
          custom_total: booking.custom_total,
          payment_option: booking.payment_option,
          payment_status: booking.payment_status,
          amount_paid: booking.amount_paid,
          checked_in: booking.checked_in,
          participants_info: booking.participants_info,
          waiver_info: booking.waiver_info || null,
          tracking_token: booking.tracking_token,
          route: booking.route ? {
            title: booking.route.title,
            price: booking.route.price,
            discount_type: booking.route.discount_type,
            discount_value: booking.route.discount_value,
            discount_from_pax: booking.route.discount_from_pax,
          } : null,
        }}
        bankInfo={bankInfo}
      />
    </BookingI18nProvider>
  );
}
