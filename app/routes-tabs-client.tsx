"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, Bike, ArrowRight, ArrowUp, ArrowDown, Gauge, Mountain } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import type { Route } from "@/lib/types";

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

type TabType = "all" | "one_day" | "multi_day";

export default function RoutesTabsClient({ routes }: { routes: Route[] }) {
  const [activeTab, setActiveTab] = useState<TabType>("all");

  const filteredRoutes = routes.filter((route) => {
    if (activeTab === "one_day") return !route.is_multi_day;
    if (activeTab === "multi_day") return route.is_multi_day;
    return true;
  });

  const tabs: { key: TabType; label: string }[] = [
    { key: "all", label: "All Tours" },
    { key: "one_day", label: "One Day" },
    { key: "multi_day", label: "Multi-Day" },
  ];

  return (
    <div>
      {/* Tabs */}
      {tabs.length > 1 && (
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-orange-500 text-white shadow-sm"
                  : "bg-white dark:bg-card text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-border hover:border-orange-300 dark:hover:border-primary/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {filteredRoutes.length === 0 ? (
        <div className="text-center py-16">
          <Mountain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">
            {activeTab === "multi_day"
              ? "Multi-Day tours coming soon!"
              : activeTab === "one_day"
              ? "One Day tours coming soon!"
              : "No tours available yet"}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {activeTab !== "all"
              ? "Stay tuned — we're preparing amazing new routes for this category."
              : "Check back later for amazing eBike adventures."}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoutes.map((route) => (
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
                  <div className="absolute top-3 right-3 flex gap-2">
                    {route.is_multi_day && (
                      <Badge className="bg-blue-500/90 text-white shadow-sm">Multi-Day</Badge>
                    )}
                    <Badge className={`${getDifficultyColor(route.difficulty)} shadow-sm`}>
                      {route.difficulty}
                    </Badge>
                  </div>
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
                    <p className="text-xs text-gray-400 dark:text-muted-foreground">{route.price_label || "per person"}</p>
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
      )}
    </div>
  );
}
