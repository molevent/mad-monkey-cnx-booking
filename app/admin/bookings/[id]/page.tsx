import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, User, Mail, Phone, Calendar, Clock, Users, Ruler, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { formatDate, formatTime, formatPrice, getStatusColor, getStatusLabel, calculateTotalWithDiscount } from "@/lib/utils";
import BookingActions from "./booking-actions";
import BookingEditForm from "./booking-edit-form";
import BookingSummary from "./booking-summary";
import PaymentStatus from "./payment-status";
import type { Booking } from "@/lib/types";

export const dynamic = "force-dynamic";

function extractStoragePath(url: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.substring(idx + marker.length);
}

async function getBooking(id: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, route:routes(*)")
    .eq("id", id)
    .single();

  if (error) return null;

  let paymentSlipSignedUrl: string | null = null;
  let waiverSignatureSignedUrl: string | null = null;

  if (data.payment_slip_url) {
    const path = extractStoragePath(data.payment_slip_url, "payment-slips");
    if (path) {
      const { data: signed } = await supabase.storage
        .from("payment-slips")
        .createSignedUrl(path, 3600);
      paymentSlipSignedUrl = signed?.signedUrl || null;
    }
  }

  if (data.waiver_signature_url) {
    const path = extractStoragePath(data.waiver_signature_url, "waiver-signatures");
    if (path) {
      const { data: signed } = await supabase.storage
        .from("waiver-signatures")
        .createSignedUrl(path, 3600);
      waiverSignatureSignedUrl = signed?.signedUrl || null;
    }
  }

  // Generate signed URLs for per-participant waiver signatures
  const waiverInfoWithSignedUrls = [];
  if (Array.isArray(data.waiver_info)) {
    for (const w of data.waiver_info) {
      let signedSigUrl: string | null = null;
      if (w.signature_url) {
        const sigPath = extractStoragePath(w.signature_url, "waiver-signatures");
        if (sigPath) {
          const { data: signed } = await supabase.storage
            .from("waiver-signatures")
            .createSignedUrl(sigPath, 3600);
          signedSigUrl = signed?.signedUrl || null;
        }
      }
      waiverInfoWithSignedUrls.push({ ...w, signed_signature_url: signedSigUrl });
    }
  }

  return { ...data, paymentSlipSignedUrl, waiverSignatureSignedUrl, waiver_info: waiverInfoWithSignedUrls } as Booking & {
    paymentSlipSignedUrl: string | null;
    waiverSignatureSignedUrl: string | null;
  };
}

async function getRoutes() {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("routes")
    .select("id, title")
    .order("title");
  return data || [];
}

export default async function BookingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [booking, routes] = await Promise.all([
    getBooking(params.id),
    getRoutes(),
  ]);

  if (!booking) {
    notFound();
  }

  const { total: totalAmount } = calculateTotalWithDiscount(
    booking.route?.price || 0,
    booking.pax_count,
    booking.route?.discount_type || 'none',
    booking.route?.discount_value || 0,
    booking.route?.discount_from_pax || 2
  );

  return (
    <div>
      <Link
        href="/admin/bookings"
        className="inline-flex items-center text-gray-600 hover:text-primary mb-6"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Bookings
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Booking Details</h1>
          <p className="text-gray-500">ID: {booking.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`text-lg px-4 py-2 ${getStatusColor(booking.status)}`}>
            {getStatusLabel(booking.status)}
          </Badge>
          {booking.checked_in && (
            <Badge className="text-lg px-4 py-2 bg-green-100 text-green-800">
              Checked In
            </Badge>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Editable: Status, Customer, Tour, Participants */}
          <BookingEditForm booking={booking} routes={routes} />

          {/* Payment & Waiver */}
          {(booking.payment_slip_url || booking.waiver_signature_url) && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Payment & Waiver</CardTitle>
                <Link href={`/admin/bookings/${booking.id}/waiver`}>
                  <Button variant="outline" size="sm">
                    <Printer className="h-4 w-4 mr-1" />
                    Print Waiver
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {booking.paymentSlipSignedUrl && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Payment Slip</p>
                      <a
                        href={booking.paymentSlipSignedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <div className="bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={booking.paymentSlipSignedUrl}
                            alt="Payment Slip"
                            className="w-full h-48 object-contain"
                          />
                        </div>
                      </a>
                    </div>
                  )}
                  {booking.waiverSignatureSignedUrl && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Waiver Signature</p>
                      <div className="bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={booking.waiverSignatureSignedUrl}
                          alt="Signature"
                          className="w-full h-48 object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Per-Participant Waiver Status */}
                {Array.isArray((booking as any).waiver_info) && (booking as any).waiver_info.length > 0 && (
                  <div className="space-y-4">
                    <p className="font-semibold text-sm">Waiver Status by Rider</p>
                    {(booking as any).waiver_info.map((w: any, i: number) => (
                      <div key={i} className={`p-4 rounded-lg text-sm ${w.signed ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">
                            Rider {w.participant_index + 1}: {w.signer_name}
                            {w.signed ? <span className="text-green-600 ml-2">✓ Signed</span> : <span className="text-yellow-600 ml-2">⏳ Pending</span>}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 mb-2">
                          <span>Passport: {w.passport_no || "—"}</span>
                          <span>Date: {w.date || "—"}</span>
                          <span>Email: {w.email || "—"}</span>
                        </div>
                        {w.signed && w.signed_signature_url && (
                          <div className="mt-2 bg-white rounded border p-2">
                            <p className="text-xs text-gray-400 mb-1">Signature</p>
                            <img
                              src={w.signed_signature_url}
                              alt={`Signature of ${w.signer_name}`}
                              className="h-20 object-contain"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-6">
          <BookingSummary
            bookingId={booking.id}
            calculatedTotal={totalAmount}
            customTotal={booking.custom_total}
            pricePerPerson={booking.route?.price || 0}
            paxCount={booking.pax_count}
            createdAt={booking.created_at}
          />

          <PaymentStatus
            bookingId={booking.id}
            totalAmount={booking.custom_total ?? totalAmount}
            paymentOption={booking.payment_option}
            paymentStatus={booking.payment_status || "unpaid"}
            amountPaid={booking.amount_paid || 0}
          />

          <BookingActions booking={booking} />
        </div>
      </div>
    </div>
  );
}
