"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bike, MapPin, Clock, Users, ArrowUp, ArrowDown, Gauge, Route as RouteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import TourCalendar from "./tour-calendar";

interface BookingDate {
  tour_date: string;
  total_pax: number;
  booking_count: number;
}

interface Route {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  difficulty: string;
  duration: string | null;
  price: number;
  cover_image_url: string | null;
  komoot_iframe: string | null;
  distance_mi: number | null;
  avg_speed_mph: number | null;
  uphill_ft: number | null;
  downhill_ft: number | null;
}

interface Props {
  route: Route;
  bookingDates: BookingDate[];
}

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case "Easy":
      return "bg-green-100 text-green-800";
    case "Medium":
      return "bg-yellow-100 text-yellow-800";
    case "Hard":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function TourDetailClient({ route, bookingDates }: Props) {
  const { t } = useI18n();
  const [useMetric, setUseMetric] = useState(false);

  const hasStats = route.distance_mi || route.avg_speed_mph || route.uphill_ft || route.downhill_ft;

  const includedItems = [
    t("tour.included_ebike"),
    t("tour.included_helmet"),
    t("tour.included_guide"),
    t("tour.included_water"),
    t("tour.included_insurance"),
    t("tour.included_photos"),
  ];

  return (
    <div className="bg-white dark:bg-background min-h-screen">
      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cover Image */}
            <div className="relative h-64 md:h-96 bg-gray-200 dark:bg-secondary rounded-xl overflow-hidden">
              {route.cover_image_url ? (
                <Image
                  src={route.cover_image_url}
                  alt={route.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 66vw"
                  priority
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Bike className="h-24 w-24 text-gray-400" />
                </div>
              )}
            </div>

            {/* Tour Info */}
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Badge className={getDifficultyColor(route.difficulty)}>
                  {route.difficulty}
                </Badge>
                <div className="flex items-center gap-1 text-gray-500 dark:text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Approx. {route.duration || "Half Day"} Hours
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{route.title}</h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                {route.description || "Join us for an unforgettable eBike adventure through the beautiful landscapes of Chiang Mai."}
              </p>

              {/* Route Stats Bar */}
              {hasStats && (
                <div className="mt-6 p-4 bg-gray-50 dark:bg-secondary rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase tracking-wide">Ride Stats</span>
                    <button
                      onClick={() => setUseMetric(!useMetric)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {useMetric ? "Switch to Imperial" : "Switch to Metric"}
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-700 dark:text-gray-300">
                    {route.duration && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>Approx. {route.duration} Hours</span>
                      </div>
                    )}
                    {route.distance_mi && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400">↔</span>
                        <span>
                          {useMetric
                            ? `${(route.distance_mi * 1.60934).toFixed(1)} km`
                            : `${route.distance_mi} mi`}
                        </span>
                      </div>
                    )}
                    {route.avg_speed_mph && (
                      <div className="flex items-center gap-1.5">
                        <Gauge className="h-4 w-4 text-gray-400" />
                        <span>
                          {useMetric
                            ? `${(route.avg_speed_mph * 1.60934).toFixed(1)} km/h`
                            : `${route.avg_speed_mph} mph`}
                        </span>
                      </div>
                    )}
                    {route.uphill_ft && (
                      <div className="flex items-center gap-1.5">
                        <ArrowUp className="h-4 w-4 text-green-500" />
                        <span>
                          {useMetric
                            ? `${Math.round(route.uphill_ft * 0.3048)} m`
                            : `${route.uphill_ft.toLocaleString()} ft`}
                        </span>
                      </div>
                    )}
                    {route.downhill_ft && (
                      <div className="flex items-center gap-1.5">
                        <ArrowDown className="h-4 w-4 text-red-500" />
                        <span>
                          {useMetric
                            ? `${Math.round(route.downhill_ft * 0.3048)} m`
                            : `${route.downhill_ft.toLocaleString()} ft`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Booking Calendar */}
            <TourCalendar bookingDates={bookingDates} slug={route.slug} />

            {/* Komoot Map */}
            {route.komoot_iframe && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    {t("tour.route_map")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="komoot-embed rounded-lg overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: route.komoot_iframe }}
                  />
                </CardContent>
              </Card>
            )}

            {/* What's Included */}
            <Card>
              <CardHeader>
                <CardTitle>{t("tour.whats_included")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid md:grid-cols-2 gap-3">
                  {includedItems.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-primary rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>{t("tour.book_this_tour")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-3xl font-bold text-primary">
                    {formatPrice(route.price)}
                  </p>
                  <p className="text-gray-500 dark:text-muted-foreground">{t("tour.per_person")}</p>
                </div>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{t("tour.duration")}: Approx. {route.duration || "Half Day"} Hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{t("tour.max_group")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{t("tour.start_location")}</span>
                  </div>
                </div>

                <Link href={`/book/${route.slug}`} className="block">
                  <Button size="lg" className="w-full">
                    {t("tour.request_booking")}
                  </Button>
                </Link>

                <p className="text-xs text-gray-500 dark:text-muted-foreground text-center">
                  {t("tour.free_cancel")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
