import { createServerSupabaseClient } from "@/lib/supabase/server";
import RoutesContent from "./routes-content";
import type { Route } from "@/lib/types";

async function getRoutes(): Promise<Route[]> {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("routes")
    .select("*")
    .order("created_at", { ascending: false });
  return data || [];
}

export default async function RoutesPage() {
  const routes = await getRoutes();
  return <RoutesContent routes={routes} />;
}
