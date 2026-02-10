"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";

export async function uploadPaymentSlip(formData: FormData) {
  const supabase = createServiceRoleClient();
  
  const file = formData.get("file") as File;
  const bookingId = formData.get("bookingId") as string;

  if (!file || !bookingId) {
    return { error: "Missing file or booking ID" };
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${bookingId}-${Date.now()}.${fileExt}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("payment-slips")
    .upload(fileName, file);

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return { error: "Failed to upload file" };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("payment-slips")
    .getPublicUrl(fileName);

  // Update booking with payment slip URL
  const { error: updateError } = await supabase
    .from("bookings")
    .update({ 
      payment_slip_url: urlData.publicUrl,
      status: "PAYMENT_UPLOADED"
    })
    .eq("id", bookingId);

  if (updateError) {
    console.error("Update error:", updateError);
    return { error: "Failed to update booking" };
  }

  return { success: true, url: urlData.publicUrl };
}

export async function uploadWaiverSignature({
  bookingId,
  signatureData,
  participantIndex,
}: {
  bookingId: string;
  signatureData: string;
  participantIndex?: number;
}) {
  const supabase = createServiceRoleClient();

  // Convert base64 to blob
  const base64Data = signatureData.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  const suffix = participantIndex !== undefined ? `-p${participantIndex}` : "";
  const fileName = `${bookingId}-signature${suffix}-${Date.now()}.png`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("waiver-signatures")
    .upload(fileName, buffer, {
      contentType: "image/png",
    });

  if (uploadError) {
    console.error("Signature upload error:", uploadError);
    return { error: "Failed to upload signature" };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("waiver-signatures")
    .getPublicUrl(fileName);

  // Update booking with signature URL
  const { error: updateError } = await supabase
    .from("bookings")
    .update({ waiver_signature_url: urlData.publicUrl })
    .eq("id", bookingId);

  if (updateError) {
    console.error("Update error:", updateError);
    return { error: "Failed to update booking" };
  }

  return { success: true, url: urlData.publicUrl };
}

export async function uploadRouteImage(formData: FormData) {
  const supabase = createServiceRoleClient();
  
  const file = formData.get("file") as File;

  if (!file) {
    return { error: "No file provided" };
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `route-${Date.now()}.${fileExt}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("route-images")
    .upload(fileName, file);

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return { error: "Failed to upload image" };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("route-images")
    .getPublicUrl(fileName);

  return { success: true, url: urlData.publicUrl };
}
