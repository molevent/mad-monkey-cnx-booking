"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/transport";
import { acknowledgementEmail, paymentRequestEmail, confirmationEmail } from "@/lib/email/templates";
import { getEmailSettings } from "@/app/actions/email-settings";
import { formatDate, formatTime, calculateTotalWithDiscount } from "@/lib/utils";
import { generateQRCodeDataURL } from "@/lib/qrcode";
import type { Participant, WaiverInfo } from "@/lib/types";

interface CreateBookingInput {
  route_slug: string;
  tour_date: string;
  start_time: string;
  customer_name: string;
  customer_email: string;
  customer_whatsapp: string;
  pax_count: number;
  participants_info: Participant[];
}

export async function createBooking(input: CreateBookingInput) {
  const supabase = createServiceRoleClient();

  // Get route by slug
  const { data: route, error: routeError } = await supabase
    .from("routes")
    .select("id, title, price")
    .eq("slug", input.route_slug)
    .single();

  if (routeError || !route) {
    return { error: "Tour not found" };
  }

  // Find or create customer record
  let customerId: string | null = null;
  try {
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id, total_bookings")
      .eq("email", input.customer_email.toLowerCase().trim())
      .single();

    if (existingCustomer) {
      customerId = existingCustomer.id;
      // Update customer info with latest details
      await supabase
        .from("customers")
        .update({
          full_name: input.customer_name,
          whatsapp: input.customer_whatsapp || null,
          total_bookings: (existingCustomer.total_bookings || 0) + 1,
          last_booking_at: new Date().toISOString(),
        })
        .eq("id", existingCustomer.id);
    } else {
      const { data: newCustomer } = await supabase
        .from("customers")
        .insert({
          email: input.customer_email.toLowerCase().trim(),
          full_name: input.customer_name,
          whatsapp: input.customer_whatsapp || null,
          total_bookings: 1,
          last_booking_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (newCustomer) customerId = newCustomer.id;
    }
  } catch (e) {
    // Non-critical — continue without customer link
    console.error("Customer upsert error:", e);
  }

  // Create booking
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      route_id: route.id,
      tour_date: input.tour_date,
      start_time: input.start_time,
      customer_name: input.customer_name,
      customer_email: input.customer_email,
      customer_whatsapp: input.customer_whatsapp,
      pax_count: input.pax_count,
      participants_info: input.participants_info,
      status: "PENDING_REVIEW",
      customer_id: customerId,
    })
    .select("tracking_token")
    .single();

  if (bookingError) {
    console.error("Booking error:", bookingError);
    return { error: "Failed to create booking" };
  }

  // Send acknowledgement email
  const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/track/${booking.tracking_token}`;
  const emailSettings = await getEmailSettings();
  
  await sendEmail({
    to: input.customer_email,
    subject: emailSettings.acknowledgement_subject,
    html: acknowledgementEmail({
      customerName: input.customer_name,
      routeTitle: route.title,
      tourDate: formatDate(input.tour_date),
      startTime: formatTime(input.start_time),
      paxCount: input.pax_count,
      trackingUrl,
      settings: emailSettings,
    }),
  });

  return { success: true, tracking_token: booking.tracking_token };
}

export async function approveBooking(bookingId: string) {
  const supabase = createServiceRoleClient();

  // Get booking with route details
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("*, route:routes(*)")
    .eq("id", bookingId)
    .single();

  if (fetchError || !booking) {
    return { error: "Booking not found" };
  }

  // Update status
  const { error: updateError } = await supabase
    .from("bookings")
    .update({ status: "AWAITING_PAYMENT" })
    .eq("id", bookingId);

  if (updateError) {
    return { error: "Failed to update booking" };
  }

  // Send payment request email
  const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/track/${booking.tracking_token}`;
  const calculatedTotal = calculateTotalWithDiscount(
    booking.route.price,
    booking.pax_count,
    booking.route.discount_type || 'none',
    booking.route.discount_value || 0,
    booking.route.discount_from_pax || 2
  ).total;
  const totalAmount = booking.custom_total ?? calculatedTotal;
  const emailSettings = await getEmailSettings();

  await sendEmail({
    to: booking.customer_email,
    subject: emailSettings.payment_subject,
    html: paymentRequestEmail({
      customerName: booking.customer_name,
      routeTitle: booking.route.title,
      tourDate: formatDate(booking.tour_date),
      totalAmount,
      paymentUrl,
      settings: emailSettings,
    }),
  });

  revalidatePath(`/track/${booking.tracking_token}`);
  revalidatePath("/admin/bookings");

  return { success: true };
}

export async function confirmBooking(bookingId: string) {
  const supabase = createServiceRoleClient();

  // Get booking with route details
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("*, route:routes(*)")
    .eq("id", bookingId)
    .single();

  if (fetchError || !booking) {
    return { error: "Booking not found" };
  }

  // Update status
  const { error: updateError } = await supabase
    .from("bookings")
    .update({ status: "CONFIRMED" })
    .eq("id", bookingId);

  if (updateError) {
    return { error: "Failed to confirm booking" };
  }

  // Generate QR code for check-in (encodes the tracking token)
  const checkInUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/check-in?code=${booking.tracking_token}`;
  const qrCodeDataUrl = await generateQRCodeDataURL(checkInUrl);

  // Send confirmation email
  const emailSettings = await getEmailSettings();

  await sendEmail({
    to: booking.customer_email,
    subject: emailSettings.confirmation_subject,
    html: confirmationEmail({
      customerName: booking.customer_name,
      routeTitle: booking.route.title,
      tourDate: formatDate(booking.tour_date),
      startTime: formatTime(booking.start_time),
      bookingRef: booking.tracking_token,
      qrCodeDataUrl,
      settings: emailSettings,
    }),
  });

  revalidatePath(`/track/${booking.tracking_token}`);
  revalidatePath("/admin/bookings");

  return { success: true };
}

export async function cancelBooking(bookingId: string) {
  const supabase = createServiceRoleClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("tracking_token")
    .eq("id", bookingId)
    .single();

  const { error } = await supabase
    .from("bookings")
    .update({ status: "CANCELLED" })
    .eq("id", bookingId);

  if (error) {
    return { error: "Failed to cancel booking" };
  }

  if (booking?.tracking_token) {
    revalidatePath(`/track/${booking.tracking_token}`);
  }
  revalidatePath("/admin/bookings");

  return { success: true };
}

export async function updateBookingNotes(bookingId: string, notes: string) {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("bookings")
    .update({ admin_notes: notes })
    .eq("id", bookingId);

  if (error) {
    return { error: "Failed to update notes" };
  }

  return { success: true };
}

export async function setPaymentOption(
  bookingId: string,
  paymentOption: 'deposit_50' | 'full_100' | 'pay_at_venue'
) {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("bookings")
    .update({ payment_option: paymentOption })
    .eq("id", bookingId);

  if (error) {
    return { error: "Failed to set payment option" };
  }

  return { success: true };
}

export async function markPaymentStatus(
  bookingId: string,
  status: 'deposit_paid' | 'fully_paid',
  amountPaid: number
) {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("bookings")
    .update({ payment_status: status, amount_paid: amountPaid })
    .eq("id", bookingId);

  if (error) {
    return { error: "Failed to update payment status" };
  }

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);

  return { success: true };
}

export async function checkInBooking(bookingId: string) {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("bookings")
    .update({ checked_in: true, checked_in_at: new Date().toISOString() })
    .eq("id", bookingId);

  if (error) {
    return { error: "Failed to check in booking" };
  }

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/check-in");

  return { success: true };
}

export async function undoCheckIn(bookingId: string) {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("bookings")
    .update({ checked_in: false, checked_in_at: null })
    .eq("id", bookingId);

  if (error) {
    return { error: "Failed to undo check-in" };
  }

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/check-in");

  return { success: true };
}

export async function lookupBookingForCheckIn(code: string) {
  const supabase = createServiceRoleClient();

  // Try lookup by tracking_token first, then by ID
  let { data: booking, error } = await supabase
    .from("bookings")
    .select("*, route:routes(title, price)")
    .eq("tracking_token", code)
    .maybeSingle();

  if (!booking) {
    const result = await supabase
      .from("bookings")
      .select("*, route:routes(title, price)")
      .eq("id", code)
      .maybeSingle();
    booking = result.data;
    error = result.error;
  }

  if (error || !booking) {
    return { error: "Booking not found" };
  }

  return { booking };
}

export async function updateBookingTotal(bookingId: string, customTotal: number | null) {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("bookings")
    .update({ custom_total: customTotal })
    .eq("id", bookingId);

  if (error) {
    return { error: "Failed to update total amount" };
  }

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);

  return { success: true };
}

export async function saveWaiverInfo(bookingId: string, waiverInfo: WaiverInfo) {
  const supabase = createServiceRoleClient();

  // Get existing waiver_info array
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("waiver_info")
    .eq("id", bookingId)
    .single();

  if (fetchError) {
    return { error: "Booking not found" };
  }

  const existingWaivers: WaiverInfo[] = booking.waiver_info || [];

  // Replace or add this participant's waiver
  const idx = existingWaivers.findIndex(
    (w: WaiverInfo) => w.participant_index === waiverInfo.participant_index
  );
  if (idx >= 0) {
    existingWaivers[idx] = waiverInfo;
  } else {
    existingWaivers.push(waiverInfo);
  }

  const { error } = await supabase
    .from("bookings")
    .update({ waiver_info: existingWaivers })
    .eq("id", bookingId);

  if (error) {
    console.error("Save waiver info error:", error);
    return { error: "Failed to save waiver information" };
  }

  return { success: true };
}

export async function sendWaiverEmailToParticipant(
  bookingId: string,
  participantIndex: number,
  participantName: string,
  participantEmail: string
) {
  const supabase = createServiceRoleClient();

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("tracking_token, route:routes(title), tour_date")
    .eq("id", bookingId)
    .single();

  if (error || !booking) {
    return { error: "Booking not found" };
  }

  const waiverUrl = `${process.env.NEXT_PUBLIC_APP_URL}/waiver/${booking.tracking_token}/${participantIndex}`;

  const emailSettings = await getEmailSettings();

  await sendEmail({
    to: participantEmail,
    subject: `Liability Waiver - ${emailSettings.company_name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #F58020; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 20px;">${emailSettings.company_name}</h1>
        </div>
        <div style="padding: 30px; background: #ffffff;">
          <h2 style="color: #333;">Liability Waiver Required</h2>
          <p>Hi <strong>${participantName}</strong>,</p>
          <p>You have been registered for an upcoming tour with ${emailSettings.company_name}. Before the tour, you need to complete and sign the Liability Waiver.</p>
          <p><strong>Tour:</strong> ${(booking as any).route?.title || "eBike Tour"}<br/>
          <strong>Date:</strong> ${formatDate(booking.tour_date)}</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${waiverUrl}" style="background-color: #F58020; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Sign Waiver Now
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">If you cannot sign online, a printed copy will be provided at check-in. Please bring a valid passport or ID for verification.</p>
        </div>
        <div style="background-color: #333; color: #999; padding: 15px; text-align: center; font-size: 12px;">
          ${emailSettings.company_name} — ${emailSettings.company_address}
        </div>
      </div>
    `,
  });

  return { success: true };
}
