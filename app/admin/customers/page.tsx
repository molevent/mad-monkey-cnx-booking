import { createServerSupabaseClient } from "@/lib/supabase/server";
import CustomersContent from "./customers-content";
import type { Customer } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getCustomers() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("last_booking_at", { ascending: false, nullsFirst: false });
  return (data as Customer[]) || [];
}

export default async function CustomersPage() {
  const customers = await getCustomers();
  return <CustomersContent customers={customers} />;
}
