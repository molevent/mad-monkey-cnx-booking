import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import BookingForm from "./booking-form";
import BookingPageWrapper from "./booking-wrapper";

export default async function BookingFormPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createServerSupabaseClient();
  const { data: route, error } = await supabase
    .from("routes")
    .select("title, description, difficulty, duration, price, cover_image_url, discount_type, discount_value, discount_from_pax, distance_mi, avg_speed_mph, uphill_ft, downhill_ft")
    .eq("slug", params.slug)
    .eq("is_active", true)
    .single();

  if (error || !route) {
    notFound();
  }

  return (
    <BookingPageWrapper>
      <BookingForm
        slug={params.slug}
        route={{
          title: route.title,
          description: route.description || null,
          difficulty: route.difficulty || "Medium",
          duration: route.duration || null,
          price: route.price,
          cover_image_url: route.cover_image_url || null,
          discount_type: route.discount_type || "none",
          discount_value: route.discount_value || 0,
          discount_from_pax: route.discount_from_pax || 2,
          distance_mi: route.distance_mi || null,
          avg_speed_mph: route.avg_speed_mph || null,
          uphill_ft: route.uphill_ft || null,
          downhill_ft: route.downhill_ft || null,
        }}
      />
    </BookingPageWrapper>
  );
}
