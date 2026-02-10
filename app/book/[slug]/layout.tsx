import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const LOGO_URL = "/logo.png";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const supabase = createServerSupabaseClient();
  const { data: route } = await supabase
    .from("routes")
    .select("title, description, cover_image_url, difficulty, duration")
    .eq("slug", params.slug)
    .single();

  if (!route) {
    return { title: "Book Tour" };
  }

  const description = `Book the ${route.title} eBike tour in Chiang Mai. ${route.difficulty} difficulty, ${route.duration}. Reserve your spot today!`;
  const ogImage = route.cover_image_url || LOGO_URL;

  return {
    title: `Book ${route.title}`,
    description,
    openGraph: {
      title: `Book ${route.title} | Mad Monkey eBike Tours`,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `Book ${route.title}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `Book ${route.title} | Mad Monkey eBike Tours`,
      description,
      images: [ogImage],
    },
  };
}

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
