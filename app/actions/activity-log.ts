"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";

export type ActivityLevel = "info" | "warning" | "error" | "success";
export type ActorType = "admin" | "customer" | "system";

interface LogActivityInput {
  bookingId: string;
  action: string;
  description: string;
  actorType?: ActorType;
  actorEmail?: string;
  metadata?: Record<string, any>;
  level?: ActivityLevel;
}

export async function logActivity(input: LogActivityInput) {
  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("booking_activity_log").insert({
    booking_id: input.bookingId,
    action: input.action,
    description: input.description,
    actor_type: input.actorType || "system",
    actor_email: input.actorEmail || null,
    metadata: input.metadata || {},
    level: input.level || "info",
  });

  if (error) {
    console.error("Failed to log activity:", error);
  }
}

export async function getBookingActivityLog(bookingId: string) {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("booking_activity_log")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch activity log:", error);
    return [];
  }

  return data || [];
}
