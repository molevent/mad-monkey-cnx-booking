// Staff notification helper — sends email + WhatsApp when a new booking arrives.
// Reads recipients & WhatsApp config from email_settings (admin-managed).
// All sends are best-effort: errors are logged, never thrown to the caller.

import { sendEmail } from "@/lib/email/transport"
import { staffBookingNotificationEmail, type EmailSettings } from "@/lib/email/templates"

export interface NewBookingNotificationInput {
  customerName: string
  customerEmail: string
  customerWhatsapp: string
  routeTitle: string
  tourDate: string
  startTime: string
  paxCount: number
  pickupLocation?: string | null
  trackingToken: string
  settings: EmailSettings
}

function parseEmailList(raw: string): string[] {
  if (!raw) return []
  return raw
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter((s) => s && /.+@.+\..+/.test(s))
}

function plainTextSummary(input: NewBookingNotificationInput): string {
  const lines = [
    `🚴 New booking — ${input.settings.company_name}`,
    ``,
    `Tour: ${input.routeTitle}`,
    `Date: ${input.tourDate}`,
  ]
  if (input.startTime && input.startTime !== "To be confirmed") {
    lines.push(`Time: ${input.startTime}`)
  }
  lines.push(`Riders: ${input.paxCount}`)
  if (input.pickupLocation) lines.push(`Pick-up: ${input.pickupLocation}`)
  lines.push(``)
  lines.push(`Customer: ${input.customerName}`)
  lines.push(`Email: ${input.customerEmail}`)
  if (input.customerWhatsapp) lines.push(`WhatsApp: ${input.customerWhatsapp}`)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ""
  if (appUrl) {
    lines.push(``)
    lines.push(`Open in dashboard: ${appUrl}/admin/bookings`)
  }
  return lines.join("\n")
}

async function sendStaffEmails(input: NewBookingNotificationInput) {
  const recipients = parseEmailList(input.settings.notification_emails)
  if (recipients.length === 0) return

  const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/admin/bookings`
  const subject = `🚴 New Booking — ${input.routeTitle} (${input.paxCount} pax) — ${input.settings.company_name}`
  const html = staffBookingNotificationEmail({
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerWhatsapp: input.customerWhatsapp,
    routeTitle: input.routeTitle,
    tourDate: input.tourDate,
    startTime: input.startTime,
    paxCount: input.paxCount,
    pickupLocation: input.pickupLocation,
    adminUrl,
    settings: input.settings,
  })

  // Fire each email in parallel; swallow individual failures.
  await Promise.all(
    recipients.map((to) =>
      sendEmail({ to, subject, html }).catch((err) => {
        console.error(`[notify] Failed to send staff email to ${to}:`, err)
      })
    )
  )
}

async function sendCallMeBotWhatsApp(input: NewBookingNotificationInput) {
  const phone = (input.settings.whatsapp_callmebot_phone || "").replace(/[^0-9]/g, "")
  const apikey = (input.settings.whatsapp_callmebot_apikey || "").trim()
  if (!phone || !apikey) return

  const text = plainTextSummary(input)
  const url =
    `https://api.callmebot.com/whatsapp.php` +
    `?phone=${encodeURIComponent(phone)}` +
    `&apikey=${encodeURIComponent(apikey)}` +
    `&text=${encodeURIComponent(text)}`

  try {
    const res = await fetch(url, { method: "GET" })
    if (!res.ok) {
      console.error(
        `[notify] CallMeBot WhatsApp returned ${res.status}: ${await res.text().catch(() => "")}`
      )
    }
  } catch (err) {
    console.error("[notify] CallMeBot WhatsApp send failed:", err)
  }
}

async function sendGenericWebhook(input: NewBookingNotificationInput) {
  const url = (input.settings.whatsapp_webhook_url || "").trim()
  if (!url) return

  const payload = {
    type: "new_booking",
    company: input.settings.company_name,
    text: plainTextSummary(input),
    booking: {
      tracking_token: input.trackingToken,
      route: input.routeTitle,
      tour_date: input.tourDate,
      start_time: input.startTime,
      pax_count: input.paxCount,
      pickup_location: input.pickupLocation,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      customer_whatsapp: input.customerWhatsapp,
    },
    admin_url: `${process.env.NEXT_PUBLIC_APP_URL || ""}/admin/bookings`,
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      console.error(
        `[notify] Webhook returned ${res.status}: ${await res.text().catch(() => "")}`
      )
    }
  } catch (err) {
    console.error("[notify] Webhook send failed:", err)
  }
}

export async function notifyStaffOfNewBooking(input: NewBookingNotificationInput) {
  if ((input.settings.notify_on_new_booking || "").toLowerCase() === "false") return

  // Run all channels in parallel; each handles its own errors.
  await Promise.allSettled([
    sendStaffEmails(input),
    sendCallMeBotWhatsApp(input),
    sendGenericWebhook(input),
  ])
}
