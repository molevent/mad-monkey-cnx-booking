import Image from "next/image";
import { Mountain } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Route } from "@/lib/types";
import RoutesTabsClient from "./routes-tabs-client";

async function getRoutes(): Promise<Route[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("routes")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching routes:", error);
    return [];
  }

  return data || [];
}

export default async function HomePage() {
  const routes = await getRoutes();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-orange-600 via-orange-500 to-yellow-500 text-white">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="flex items-center gap-3 mb-4">
            <Image src="/logo.png" alt="Mad Monkey" width={48} height={48} className="h-12 w-12 object-contain" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Mad Monkey eBike Tours</h1>
              <p className="text-orange-100 text-sm md:text-base">Chiang Mai, Thailand</p>
            </div>
          </div>
          <p className="text-lg md:text-xl text-orange-50 max-w-2xl">
            Explore the mountains, temples, and hidden gems of Northern Thailand on electric bikes.
          </p>
        </div>
      </div>

      {/* Tours Grid */}
      <div className="container mx-auto px-4 py-8">
        {routes.length === 0 ? (
          <div className="text-center py-16">
            <Mountain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">Tours coming soon!</p>
            <p className="text-gray-400 text-sm mt-1">Check back later for amazing eBike adventures.</p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-6">
              Our Tours
            </h2>
            <RoutesTabsClient routes={routes} />
          </>
        )}
      </div>
    </div>
  );
}
