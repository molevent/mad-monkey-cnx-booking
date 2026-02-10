import Link from "next/link";
import Image from "next/image";
import { Clock, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
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
      return "bg-green-100 text-green-800";
    case "Medium":
      return "bg-yellow-100 text-yellow-800";
    case "Hard":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default async function HomePage() {
  const routes = await getRoutes();

  return (
    <div className="px-4 py-6 bg-white min-h-screen">
      {routes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            Tours coming soon! Check back later.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routes.map((route) => (
            <Card key={route.id} className="overflow-hidden bg-white border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all">
              <div className="relative h-48 bg-gray-200">
                {route.cover_image_url ? (
                  <Image
                    src={route.cover_image_url}
                    alt={route.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Bike className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                <Badge className={`absolute top-3 right-3 ${getDifficultyColor(route.difficulty)}`}>
                  {route.difficulty}
                </Badge>
              </div>
              <CardHeader>
                <h3 className="text-xl font-semibold">{route.title}</h3>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 line-clamp-2 mb-4">
                  {route.description || "An amazing eBike adventure awaits!"}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {route.duration || "Half Day"}
                  </div>
                  <div className="font-semibold text-primary">
                    {formatPrice(route.price)}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/tours/${route.slug}`} className="w-full">
                  <Button className="w-full">View Details</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
