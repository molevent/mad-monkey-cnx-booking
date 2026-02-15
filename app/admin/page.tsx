import { createServerSupabaseClient } from "@/lib/supabase/server";
import DashboardContent from "./dashboard-content";
import type { Booking } from "@/lib/types";

async function getStats() {
  const supabase = createServerSupabaseClient();
  
  const { count: totalBookings } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true });

  const { count: pendingBookings } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("status", "PENDING_REVIEW");

  const { count: confirmedBookings } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("status", "CONFIRMED");

  const { count: totalRoutes } = await supabase
    .from("routes")
    .select("*", { count: "exact", head: true });

  return {
    totalBookings: totalBookings || 0,
    pendingBookings: pendingBookings || 0,
    confirmedBookings: confirmedBookings || 0,
    totalRoutes: totalRoutes || 0,
  };
}

async function getRecentBookings(): Promise<Booking[]> {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("bookings")
    .select("*, route:routes(title)")
    .order("created_at", { ascending: false })
    .limit(5);

  return data || [];
}

async function getCalendarBookings() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("bookings")
    .select("id, customer_name, customer_email, tour_date, start_time, pax_count, status, route:routes(title)")
    .in("status", ["PENDING_REVIEW", "AWAITING_PAYMENT", "PAYMENT_UPLOADED", "CONFIRMED"])
    .order("tour_date", { ascending: true });

  return (data || []).map((b: any) => ({
    id: b.id,
    customer_name: b.customer_name,
    customer_email: b.customer_email,
    tour_date: b.tour_date,
    start_time: b.start_time,
    pax_count: b.pax_count,
    status: b.status,
    route_title: b.route?.title || "Unknown",
  }));
}

export default async function AdminDashboard() {
  const [stats, recentBookings, calendarBookings] = await Promise.all([
    getStats(),
    getRecentBookings(),
    getCalendarBookings(),
  ]);

  return (
    <DashboardContent
      stats={stats}
      recentBookings={recentBookings}
      calendarBookings={calendarBookings}
    />
  );
}
