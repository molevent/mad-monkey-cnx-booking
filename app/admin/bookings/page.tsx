import { createServerSupabaseClient } from "@/lib/supabase/server";
import BookingsContent from "./bookings-content";
import type { Booking, BookingStatus } from "@/lib/types";

async function getBookings(): Promise<Booking[]> {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("bookings")
    .select("*, route:routes(title, price)")
    .order("created_at", { ascending: false });
  return data || [];
}

export default async function BookingsPage() {
  const allBookings = await getBookings();
  return <BookingsContent allBookings={allBookings} />;
}
