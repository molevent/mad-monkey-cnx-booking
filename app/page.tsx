import Link from "next/link";
import Image from "next/image";
import { Clock, Bike, ArrowRight, ArrowUp, ArrowDown, Gauge, Mountain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import type { Route } from "@/lib/types";

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

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case "Easy":
      return "bg-green-500/90 text-white";
    case "Medium":
      return "bg-yellow-500/90 text-white";
    case "Hard":
      return "bg-red-500/90 text-white";
    default:
      return "bg-gray-500/90 text-white";
  }
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {routes.map((route) => (
                <div
                  key={route.id}
                  className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-border overflow-hidden hover:shadow-lg hover:border-orange-300 dark:hover:border-primary/40 transition-all duration-300 group"
                >
                  {/* Image */}
                  <Link href={`/tours/${route.slug}`}>
                    <div className="relative h-52 bg-gray-200 dark:bg-secondary overflow-hidden">
                      {route.cover_image_url ? (
                        <Image
                          src={route.cover_image_url}
                          alt={route.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Bike className="h-16 w-16 text-gray-400" />
                        </div>
                      )}
                      <Badge className={`absolute top-3 right-3 ${getDifficultyColor(route.difficulty)} shadow-sm`}>
                        {route.difficulty}
                      </Badge>
                    </div>
                  </Link>

                  {/* Content */}
                  <div className="p-5">
                    <Link href={`/tours/${route.slug}`}>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-foreground mb-2 hover:text-primary transition-colors">
                        {route.title}
                      </h3>
                    </Link>
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4 leading-relaxed">
                      {route.description || "An amazing eBike adventure awaits!"}
                    </p>

                    {/* Stats Row */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-gray-500 dark:text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Approx. {route.duration || "Half Day"} Hours</span>
                      </div>
                      {route.distance_mi && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">↔</span>
                          <span>{route.distance_mi} mi / {(route.distance_mi * 1.60934).toFixed(1)} km</span>
                        </div>
                      )}
                      {route.avg_speed_mph && (
                        <div className="flex items-center gap-1">
                          <Gauge className="h-3.5 w-3.5" />
                          <span>{route.avg_speed_mph} mph</span>
                        </div>
                      )}
                      {route.uphill_ft && (
                        <div className="flex items-center gap-1">
                          <ArrowUp className="h-3.5 w-3.5 text-green-500" />
                          <span>{route.uphill_ft.toLocaleString()} ft</span>
                        </div>
                      )}
                      {route.downhill_ft && (
                        <div className="flex items-center gap-1">
                          <ArrowDown className="h-3.5 w-3.5 text-red-500" />
                          <span>{route.downhill_ft.toLocaleString()} ft</span>
                        </div>
                      )}
                    </div>

                    {/* Price & CTA */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-border">
                      <div>
                        <p className="text-xl font-bold text-primary">{formatPrice(route.price)}</p>
                        <p className="text-xs text-gray-400 dark:text-muted-foreground">per person</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/tours/${route.slug}`}
                          className="text-sm font-medium text-gray-500 dark:text-muted-foreground hover:text-primary transition-colors"
                        >
                          View Details
                        </Link>
                        <Link
                          href={`/book/${route.slug}`}
                          className="inline-flex items-center bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium px-3 h-8 rounded-full shadow-sm transition-colors"
                        >
                          Book Now <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
