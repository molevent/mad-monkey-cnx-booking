import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import BookingForm from "./booking-form";

export default async function BookingFormPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createServerSupabaseClient();
  const { data: route, error } = await supabase
    .from("routes")
    .select("title, price, discount_type, discount_value, discount_from_pax")
    .eq("slug", params.slug)
    .eq("is_active", true)
    .single();

  if (error || !route) {
    notFound();
  }

  return (
    <BookingForm
      slug={params.slug}
      route={{
        title: route.title,
        price: route.price,
        discount_type: route.discount_type || "none",
        discount_value: route.discount_value || 0,
        discount_from_pax: route.discount_from_pax || 2,
      }}
    />
  );
}
