import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Route } from "@/lib/types";
import TourPageWrapper from "./tour-page-wrapper";
import TourDetailClient from "./tour-detail-client";

const LOGO_URL = "/logo.png";

async function getRoute(slug: string): Promise<Route | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("routes")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error) {
    console.error("Error fetching route:", error);
    return null;
  }

  return data;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const route = await getRoute(params.slug);

  if (!route) {
    return { title: "Tour Not Found" };
  }

  const description = route.description
    ? route.description.substring(0, 160)
    : `Explore the ${route.title} eBike tour in Chiang Mai. ${route.difficulty} difficulty, ${route.duration}. Book now!`;

  const ogImage = route.cover_image_url || LOGO_URL;

  return {
    title: `${route.title} - ${route.difficulty} eBike Tour`,
    description,
    keywords: [
      route.title,
      "eBike tour",
      "Chiang Mai",
      route.difficulty,
      "cycling",
      "Thailand",
    ],
    openGraph: {
      title: `${route.title} | Mad Monkey eBike Tours`,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: route.title,
        },
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${route.title} | Mad Monkey eBike Tours`,
      description,
      images: [ogImage],
    },
  };
}

async function getBookingDates(routeId: string) {
  const supabase = createServerSupabaseClient();
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("bookings")
    .select("tour_date, pax_count")
    .eq("route_id", routeId)
    .gte("tour_date", today)
    .in("status", ["PENDING_REVIEW", "AWAITING_PAYMENT", "PAYMENT_UPLOADED", "CONFIRMED"]);

  if (error || !data) return [];

  // Aggregate by date
  const dateMap = new Map<string, { total_pax: number; booking_count: number }>();
  data.forEach((b) => {
    const existing = dateMap.get(b.tour_date) || { total_pax: 0, booking_count: 0 };
    existing.total_pax += b.pax_count;
    existing.booking_count += 1;
    dateMap.set(b.tour_date, existing);
  });

  return Array.from(dateMap.entries()).map(([tour_date, info]) => ({
    tour_date,
    total_pax: info.total_pax,
    booking_count: info.booking_count,
  }));
}

export default async function TourDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const route = await getRoute(params.slug);

  if (!route) {
    notFound();
  }

  const bookingDates = await getBookingDates(route.id);

  return (
    <TourPageWrapper>
      <TourDetailClient
        route={{
          id: route.id,
          slug: route.slug,
          title: route.title,
          description: route.description,
          difficulty: route.difficulty,
          duration: route.duration,
          price: route.price,
          cover_image_url: route.cover_image_url,
          komoot_iframe: route.komoot_iframe,
          distance_mi: route.distance_mi,
          avg_speed_mph: route.avg_speed_mph,
          uphill_ft: route.uphill_ft,
          downhill_ft: route.downhill_ft,
        }}
        bookingDates={bookingDates}
      />
    </TourPageWrapper>
  );
}
