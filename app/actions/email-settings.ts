"use server";

import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { EmailSettings } from "@/lib/email/templates";
import { defaultEmailSettings } from "@/lib/email/templates";

export async function getEmailSettings(): Promise<EmailSettings> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("email_settings")
    .select("key, value");

  if (error || !data || data.length === 0) {
    return defaultEmailSettings;
  }

  const settings = { ...defaultEmailSettings };
  for (const row of data) {
    if (row.key in settings) {
      (settings as any)[row.key] = row.value;
    }
  }

  return settings;
}

export async function updateEmailSettings(
  updates: Partial<EmailSettings>
): Promise<{ error?: string }> {
  const supabase = createServerSupabaseClient();

  for (const [key, value] of Object.entries(updates)) {
    const { error } = await supabase
      .from("email_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });

    if (error) {
      console.error(`Failed to update ${key}:`, error);
      return { error: `Failed to update ${key}` };
    }
  }

  revalidatePath("/admin/settings");
  return {};
}
