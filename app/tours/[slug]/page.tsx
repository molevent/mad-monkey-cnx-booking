import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Bike, MapPin, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import type { Route } from "@/lib/types";

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

export default async function TourDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const route = await getRoute(params.slug);

  if (!route) {
    notFound();
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cover Image */}
            <div className="relative h-64 md:h-96 bg-gray-200 rounded-xl overflow-hidden">
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
                <div className="flex items-center gap-1 text-gray-500">
                  <Clock className="h-4 w-4" />
                  {route.duration || "Half Day"}
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{route.title}</h1>
              <p className="text-gray-600 text-lg leading-relaxed">
                {route.description || "Join us for an unforgettable eBike adventure through the beautiful landscapes of Chiang Mai."}
              </p>
            </div>

            <Separator />

            {/* Komoot Map */}
            {route.komoot_iframe && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Route Map
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
                <CardTitle>What&apos;s Included</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid md:grid-cols-2 gap-3">
                  {[
                    "Premium eBike rental",
                    "Safety helmet",
                    "Experienced guide",
                    "Water & snacks",
                    "Accident insurance",
                    "Photos of your adventure",
                  ].map((item, i) => (
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
                <CardTitle>Book This Tour</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-3xl font-bold text-primary">
                    {formatPrice(route.price)}
                  </p>
                  <p className="text-gray-500">per person</p>
                </div>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>Duration: {route.duration || "Half Day"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>Max group size: 8 riders</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>Start: Mad Monkey HQ, Chiang Mai</span>
                  </div>
                </div>

                <Link href={`/book/${route.slug}`} className="block">
                  <Button size="lg" className="w-full">
                    Request Booking
                  </Button>
                </Link>

                <p className="text-xs text-gray-500 text-center">
                  Free cancellation up to 48 hours before the tour
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
