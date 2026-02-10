"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import type { RouteDifficulty } from "@/lib/types";

interface RouteInput {
  title: string;
  description: string;
  difficulty: RouteDifficulty;
  duration: string;
  price: number;
  cover_image_url: string | null;
  komoot_iframe: string | null;
  is_active: boolean;
  discount_type?: 'none' | 'fixed' | 'percentage';
  discount_value?: number;
  discount_from_pax?: number;
}

export async function createRoute(input: RouteInput) {
  try {
    // Validate required fields
    if (!input.title || input.title.trim().length === 0) {
      return { error: "Route title is required." };
    }
    if (!input.description || input.description.trim().length === 0) {
      return { error: "Route description is required." };
    }
    if (!input.duration || input.duration.trim().length === 0) {
      return { error: "Duration is required." };
    }
    if (!input.price || input.price <= 0) {
      return { error: "Price must be greater than 0." };
    }

    const supabase = createServiceRoleClient();
    const slug = slugify(input.title);

    // Check for duplicate slug
    const { data: existing } = await supabase
      .from("routes")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      return { error: `A route with a similar title already exists. Please use a different title.` };
    }

    // Clean data: convert empty strings to null
    const insertData: any = {
      title: input.title.trim(),
      slug,
      description: input.description.trim(),
      difficulty: input.difficulty,
      duration: input.duration.trim(),
      price: input.price,
      cover_image_url: input.cover_image_url || null,
      komoot_iframe: input.komoot_iframe || null,
      is_active: input.is_active,
      discount_type: input.discount_type || 'none',
      discount_value: input.discount_value || 0,
      discount_from_pax: input.discount_from_pax || 2,
    };

    const { data, error } = await supabase
      .from("routes")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Create route error:", error);
      if (error.code === "23505") {
        return { error: "A route with this title already exists." };
      }
      if (error.code === "22P02") {
        return { error: `Invalid value for difficulty. Must be one of: Easy, Medium, Hard.` };
      }
      return { error: `Failed to create route: ${error.message}` };
    }

    revalidatePath("/");
    revalidatePath("/admin/routes");

    return { success: true, route: data };
  } catch (err: any) {
    console.error("Unexpected error creating route:", err);
    return { error: `An unexpected error occurred: ${err.message || "Please try again."}` };
  }
}

export async function updateRoute(id: string, input: Partial<RouteInput>) {
  try {
    const supabase = createServiceRoleClient();

    const updateData: any = { ...input };
    
    // Update slug if title changed
    if (input.title) {
      updateData.slug = slugify(input.title);
    }

    // Clean empty strings to null
    if ("cover_image_url" in updateData) {
      updateData.cover_image_url = updateData.cover_image_url || null;
    }
    if ("komoot_iframe" in updateData) {
      updateData.komoot_iframe = updateData.komoot_iframe || null;
    }

    const { data, error } = await supabase
      .from("routes")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update route error:", error);
      if (error.code === "23505") {
        return { error: "A route with this title already exists." };
      }
      if (error.code === "22P02") {
        return { error: "Invalid value for difficulty. Must be one of: Easy, Medium, Hard." };
      }
      return { error: `Failed to update route: ${error.message}` };
    }

    revalidatePath("/");
    revalidatePath("/admin/routes");
    revalidatePath(`/tours/${data.slug}`);

    return { success: true, route: data };
  } catch (err: any) {
    console.error("Unexpected error updating route:", err);
    return { error: `An unexpected error occurred: ${err.message || "Please try again."}` };
  }
}

export async function deleteRoute(id: string) {
  const supabase = createServiceRoleClient();

  // Check if route has bookings
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id")
    .eq("route_id", id)
    .limit(1);

  if (bookings && bookings.length > 0) {
    return { error: "Cannot delete route with existing bookings" };
  }

  const { error } = await supabase
    .from("routes")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Delete route error:", error);
    return { error: "Failed to delete route" };
  }

  revalidatePath("/");
  revalidatePath("/admin/routes");

  return { success: true };
}

export async function toggleRouteActive(id: string, isActive: boolean) {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("routes")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) {
    console.error("Toggle route error:", error);
    return { error: "Failed to update route" };
  }

  revalidatePath("/");
  revalidatePath("/admin/routes");

  return { success: true };
}
