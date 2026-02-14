export interface EmailSettings {
  company_name: string
  company_address: string
  company_phone: string
  company_whatsapp: string
  company_email: string
  bank_name: string
  bank_account_name: string
  bank_account_number: string
  bank_swift_code: string
  meeting_point: string
  meeting_point_map_url: string
  what_to_bring: string
  acknowledgement_subject: string
  acknowledgement_heading: string
  acknowledgement_body: string
  payment_subject: string
  payment_heading: string
  payment_body: string
  payment_deadline: string
  confirmation_subject: string
  confirmation_heading: string
  confirmation_body: string
}

export const defaultEmailSettings: EmailSettings = {
  company_name: "Mad Monkey eBike Tours",
  company_address: "Chiang Mai, Thailand",
  company_phone: "",
  company_whatsapp: "",
  company_email: "booking@madmonkeycnx.com",
  bank_name: "Siam Commercial Bank (SCB)",
  bank_account_name: "Nuthawut Tharatjai",
  bank_account_number: "406-7-61675-7",
  bank_swift_code: "SICOQHBK",
  meeting_point: "Mad Monkey eBike HQ, 123 Cycling Lane, Chiang Mai",
  meeting_point_map_url: "https://maps.app.goo.gl/aE7fjFfVLoZMDaau9",
  what_to_bring: "Comfortable clothes suitable for cycling\nSunscreen and sunglasses\nValid ID/Passport\nCamera for amazing photos!",
  acknowledgement_subject: "Booking Request Received - Mad Monkey eBike Tours",
  acknowledgement_heading: "Thank you, {{customer_name}}!",
  acknowledgement_body: "We've received your booking request and our team is reviewing it. You'll hear from us within 24 hours.",
  payment_subject: "Payment Required - Mad Monkey eBike Tours",
  payment_heading: "Great news, {{customer_name}}!",
  payment_body: "Your booking has been approved! To confirm your spot, please complete the payment and sign the liability waiver.",
  payment_deadline: "48 hours",
  confirmation_subject: "Booking Confirmed! - Mad Monkey eBike Tours",
  confirmation_heading: "See you soon, {{customer_name}}!",
  confirmation_body: "Your booking is now fully confirmed. We can't wait to show you the beautiful trails of Chiang Mai!",
}

function replaceVars(text: string, vars: Record<string, string>): string {
  let result = text
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value)
  }
  return result
}

function emailLayout(headerTitle: string, headerSub: string, content: string, settings: EmailSettings): string {
  const logoUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/logo.png`
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background-color:#ffffff;padding:24px 40px 8px;border-radius:12px 12px 0 0;text-align:center;">
              <img src="${logoUrl}" alt="${settings.company_name}" width="120" height="120" style="display:block;margin:0 auto;" />
            </td>
          </tr>
          <tr>
            <td style="background-color:#F58020;padding:20px 40px;text-align:center;">
              <h1 style="margin:0;font-size:22px;color:#ffffff;font-weight:700;">${settings.company_name}</h1>
              <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,0.9);">${headerSub}</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="background-color:#ffffff;padding:40px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
              <h2 style="margin:0 0 16px;font-size:20px;color:#1f2937;">${headerTitle}</h2>
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#1f2937;padding:24px 40px;border-radius:0 0 12px 12px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#9ca3af;">${settings.company_name} &bull; ${settings.company_address}</p>
              <p style="margin:8px 0 0;font-size:12px;color:#6b7280;">This is an automated message from our booking system.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function infoBox(title: string, rows: string, borderColor: string = '#F58020'): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
    <tr>
      <td style="background:#ffffff;padding:20px;border-radius:8px;border:1px solid #e5e7eb;border-left:4px solid ${borderColor};">
        <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#374151;">${title}</p>
        ${rows}
      </td>
    </tr>
  </table>`
}

function infoRow(label: string, value: string): string {
  return `<p style="margin:4px 0;font-size:14px;color:#4b5563;"><strong style="color:#1f2937;">${label}:</strong> ${value}</p>`
}

function cancellationPolicyBlock(): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
    <tr>
      <td style="background:#fef2f2;padding:20px;border-radius:8px;border:1px solid #fecaca;border-left:4px solid #ef4444;">
        <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#991b1b;">Cancellation Policy</p>
        <p style="margin:4px 0;font-size:13px;color:#7f1d1d;">• <strong>3+ days before tour:</strong> Full refund (minus bank charges & admin fee)</p>
        <p style="margin:4px 0;font-size:13px;color:#7f1d1d;">• <strong>Less than 3 days before tour:</strong> 25% refund for full payment only</p>
        <p style="margin:4px 0;font-size:13px;color:#7f1d1d;">• <strong>No-show:</strong> No refund</p>
      </td>
    </tr>
  </table>`
}

function paymentOptionsBlock(totalAmount: number): string {
  const deposit = Math.ceil(totalAmount * 0.5)
  const fmt = (n: number) => '฿' + n.toLocaleString()
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
    <tr>
      <td style="background:#fffbeb;padding:20px;border-radius:8px;border:1px solid #fde68a;border-left:4px solid #F58020;">
        <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#92400e;">Payment Options</p>
        <p style="margin:4px 0;font-size:13px;color:#78350f;">1. <strong>50% Deposit:</strong> Pay ${fmt(deposit)} now, remaining ${fmt(totalAmount - deposit)} before tour or at venue</p>
        <p style="margin:4px 0;font-size:13px;color:#78350f;">2. <strong>Full Payment (100%):</strong> Pay ${fmt(totalAmount)} now</p>
        <p style="margin:4px 0;font-size:13px;color:#78350f;">3. <strong>Pay at Venue:</strong> Pay the full amount at check-in on the day</p>
      </td>
    </tr>
  </table>`
}

function ctaButton(text: string, url: string): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td align="center">
        <a href="${url}" style="display:inline-block;background-color:#F58020;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">${text}</a>
      </td>
    </tr>
  </table>`
}

export function acknowledgementEmail({
  customerName,
  routeTitle,
  tourDate,
  startTime,
  paxCount,
  trackingUrl,
  settings = defaultEmailSettings,
}: {
  customerName: string
  routeTitle: string
  tourDate: string
  startTime: string
  paxCount: number
  trackingUrl: string
  settings?: EmailSettings
}) {
  const vars = { customer_name: customerName }
  const heading = replaceVars(settings.acknowledgement_heading, vars)
  const body = replaceVars(settings.acknowledgement_body, vars)

  const content = `
    <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.6;">${body}</p>
    ${infoBox('Booking Details',
      infoRow('Tour', routeTitle) +
      infoRow('Date', tourDate) +
      infoRow('Start Time', startTime) +
      infoRow('Riders', String(paxCount))
    )}
    <p style="font-size:14px;color:#4b5563;">You can track your booking status anytime:</p>
    ${ctaButton('Track Your Booking', trackingUrl)}
    <p style="font-size:14px;color:#6b7280;">If you have any questions, reply to this email${settings.company_whatsapp ? ' or message us on WhatsApp at ' + settings.company_whatsapp : ''}.</p>
  `

  return emailLayout(heading, 'Booking Request Received', content, settings)
}

export function paymentRequestEmail({
  customerName,
  routeTitle,
  tourDate,
  totalAmount,
  paymentUrl,
  settings = defaultEmailSettings,
}: {
  customerName: string
  routeTitle: string
  tourDate: string
  totalAmount: number
  paymentUrl: string
  settings?: EmailSettings
}) {
  const vars = { customer_name: customerName }
  const heading = replaceVars(settings.payment_heading, vars)
  const body = replaceVars(settings.payment_body, vars)

  const content = `
    <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.6;">${body}</p>
    ${infoBox('Payment Details',
      infoRow('Tour', routeTitle) +
      infoRow('Date', tourDate) +
      infoRow('Total Amount', '฿' + totalAmount.toLocaleString())
    )}
    ${paymentOptionsBlock(totalAmount)}
    ${infoBox('Bank Transfer Information',
      infoRow('Bank', settings.bank_name) +
      infoRow('Account Name', settings.bank_account_name) +
      infoRow('Account Number', settings.bank_account_number) +
      (settings.bank_swift_code ? infoRow('SWIFT Code', settings.bank_swift_code) : ''),
      '#374151'
    )}
    <p style="font-size:14px;color:#4b5563;">Choose your payment option, upload your payment slip, and sign the waiver:</p>
    ${ctaButton('Make Payment & Sign Waiver', paymentUrl)}
    <p style="font-size:13px;color:#dc2626;font-weight:600;">Please complete within ${settings.payment_deadline} to secure your booking.</p>
    ${cancellationPolicyBlock()}
  `

  return emailLayout(heading, 'Booking Approved — Payment Required', content, settings)
}

export function confirmationEmail({
  customerName,
  routeTitle,
  tourDate,
  startTime,
  bookingRef,
  qrCodeDataUrl,
  settings = defaultEmailSettings,
}: {
  customerName: string
  routeTitle: string
  tourDate: string
  startTime: string
  bookingRef?: string
  qrCodeDataUrl?: string
  settings?: EmailSettings
}) {
  const vars = { customer_name: customerName }
  const heading = replaceVars(settings.confirmation_heading, vars)
  const body = replaceVars(settings.confirmation_body, vars)

  const whatToBringItems = settings.what_to_bring
    .split('\n')
    .filter(Boolean)
    .map(item => `<li style="margin:4px 0;font-size:14px;color:#4b5563;">${item.trim()}</li>`)
    .join('')

  const qrSection = qrCodeDataUrl && bookingRef ? `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
    <tr>
      <td style="background:#f0fdf4;padding:24px;border-radius:8px;border:1px solid #bbf7d0;text-align:center;">
        <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#166534;">Your Check-in QR Code</p>
        <p style="margin:0 0 16px;font-size:13px;color:#15803d;">Show this QR code at check-in for a quick start</p>
        <img src="${qrCodeDataUrl}" alt="Check-in QR Code" width="180" height="180" style="display:block;margin:0 auto 12px;" />
        <p style="margin:0;font-size:12px;color:#6b7280;">Booking Ref: <strong style="color:#1f2937;font-size:14px;">${bookingRef}</strong></p>
      </td>
    </tr>
  </table>` : ''

  const content = `
    <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.6;">${body}</p>
    ${infoBox('Your Booking',
      infoRow('Tour', routeTitle) +
      infoRow('Date', tourDate) +
      infoRow('Start Time', startTime) +
      (bookingRef ? infoRow('Booking Ref', bookingRef) : '')
    )}
    ${qrSection}
    ${infoBox('Meeting Point',
      `<p style="margin:0 0 8px;font-size:14px;color:#4b5563;">${settings.meeting_point}</p>` +
      (settings.meeting_point_map_url ? `<a href="${settings.meeting_point_map_url}" style="font-size:13px;color:#F58020;">View on Google Maps</a>` : ''),
      '#F58020'
    )}
    ${infoBox('What to Bring',
      `<ul style="margin:0;padding-left:20px;">${whatToBringItems}</ul>`,
      '#3b82f6'
    )}
    ${cancellationPolicyBlock()}
    <p style="font-size:14px;color:#6b7280;">Have questions? Reply to this email${settings.company_whatsapp ? ' or contact us on WhatsApp at ' + settings.company_whatsapp : ''}.</p>
  `

  return emailLayout(heading, 'Booking Confirmed!', content, settings)
}
