"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Customer } from "@/lib/types";

export async function lookupCustomerByEmail(email: string) {
  if (!email || !email.includes("@")) return { customer: null };

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (error || !data) return { customer: null };
  return { customer: data as Customer };
}

export async function getCustomerBookingHistory(email: string) {
  if (!email || !email.includes("@")) return { bookings: [] };

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("id, tour_date, status, pax_count, tracking_token, route:routes(title)")
    .eq("customer_email", email.toLowerCase().trim())
    .order("created_at", { ascending: false })
    .limit(10);

  if (error || !data) return { bookings: [] };
  return { bookings: data };
}
