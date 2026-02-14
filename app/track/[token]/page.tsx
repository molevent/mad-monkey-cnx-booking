import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, CheckCircle, CreditCard, FileSignature, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { formatDate, formatTime, formatPrice, getStatusColor, getStatusLabel, calculateTotalWithDiscount } from "@/lib/utils";
import { getEmailSettings } from "@/app/actions/email-settings";
import PaymentWaiverForm from "./payment-waiver-form";
import type { Booking } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const LOGO_URL = "/logo.png";

export const metadata: Metadata = {
  title: "Track Your Booking",
  description: "Track the status of your Mad Monkey eBike tour booking. View payment details and booking confirmation.",
  openGraph: {
    title: "Track Your Booking | Mad Monkey eBike Tours",
    description: "Track the status of your Mad Monkey eBike tour booking in Chiang Mai.",
    images: [{ url: LOGO_URL, width: 800, height: 600, alt: "Mad Monkey eBike Tours" }],
  },
  twitter: {
    card: "summary",
    title: "Track Your Booking | Mad Monkey eBike Tours",
    description: "Track the status of your Mad Monkey eBike tour booking in Chiang Mai.",
    images: [LOGO_URL],
  },
  robots: { index: false, follow: false },
};

async function getBooking(token: string): Promise<Booking | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, route:routes(*)")
    .eq("tracking_token", token)
    .single();

  if (error) {
    console.error("Error fetching booking:", error);
    return null;
  }

  return data;
}

function getStatusStep(status: string): number {
  switch (status) {
    case "PENDING_REVIEW":
      return 1;
    case "AWAITING_PAYMENT":
      return 2;
    case "PAYMENT_UPLOADED":
      return 3;
    case "CONFIRMED":
      return 4;
    case "CANCELLED":
      return 0;
    default:
      return 1;
  }
}

export default async function TrackingPage({
  params,
}: {
  params: { token: string };
}) {
  const booking = await getBooking(params.token);

  if (!booking) {
    notFound();
  }

  const currentStep = getStatusStep(booking.status);
  const showPaymentForm = booking.status === "AWAITING_PAYMENT";
  const emailSettings = showPaymentForm ? await getEmailSettings() : null;

  const steps = [
    {
      step: 1,
      icon: Clock,
      title: "Request Submitted",
      description: "We're reviewing your booking",
    },
    {
      step: 2,
      icon: CreditCard,
      title: "Payment Required",
      description: "Complete payment to confirm",
    },
    {
      step: 3,
      icon: FileSignature,
      title: "Payment Uploaded",
      description: "Verifying your payment",
    },
    {
      step: 4,
      icon: CheckCircle,
      title: "Confirmed",
      description: "See you on the trails!",
    },
  ];

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Track Your Booking</h1>
          <p className="text-gray-600">
            Booking ID: <span className="font-mono">{booking.id.slice(0, 8)}</span>
          </p>
        </div>

        {/* Status Timeline */}
        {booking.status !== "CANCELLED" && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex justify-between">
                {steps.map((s, index) => {
                  const Icon = s.icon;
                  const isCompleted = currentStep > s.step;
                  const isCurrent = currentStep === s.step;
                  return (
                    <div key={s.step} className="flex-1 relative">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                            isCompleted || isCurrent
                              ? "bg-primary text-white"
                              : "bg-gray-200 text-gray-400"
                          }`}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <p
                          className={`text-sm font-medium text-center ${
                            isCompleted || isCurrent
                              ? "text-gray-900"
                              : "text-gray-400"
                          }`}
                        >
                          {s.title}
                        </p>
                        <p className="text-xs text-gray-500 text-center hidden md:block">
                          {s.description}
                        </p>
                      </div>
                      {index < steps.length - 1 && (
                        <div
                          className={`absolute top-6 left-1/2 w-full h-0.5 ${
                            currentStep > s.step ? "bg-primary" : "bg-gray-200"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cancelled Status */}
        {booking.status === "CANCELLED" && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <div>
                  <h3 className="font-semibold text-red-700">Booking Cancelled</h3>
                  <p className="text-sm text-red-600">
                    This booking has been cancelled. Contact us if you have questions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Booking Details */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Booking Details</CardTitle>
              <Badge className={getStatusColor(booking.status)}>
                {getStatusLabel(booking.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Tour</p>
                <p className="font-semibold">{booking.route?.title || "Tour"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date & Time</p>
                <p className="font-semibold">
                  {formatDate(booking.tour_date)} at {formatTime(booking.start_time)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Lead Guest</p>
                <p className="font-semibold">{booking.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Number of Riders</p>
                <p className="font-semibold">{booking.pax_count} person(s)</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-gray-500 mb-2">Total Amount</p>
              <p className="text-2xl font-bold text-primary">
                {formatPrice(
                  booking.custom_total ??
                  calculateTotalWithDiscount(
                    booking.route?.price || 0,
                    booking.pax_count,
                    booking.route?.discount_type || 'none',
                    booking.route?.discount_value || 0,
                    booking.route?.discount_from_pax || 2
                  ).total
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment & Waiver Form */}
        {showPaymentForm && (
          <PaymentWaiverForm
            bookingId={booking.id}
            trackingToken={params.token}
            participants={booking.participants_info}
            existingWaivers={booking.waiver_info || null}
            totalAmount={
              booking.custom_total ??
              calculateTotalWithDiscount(
                booking.route?.price || 0,
                booking.pax_count,
                booking.route?.discount_type || 'none',
                booking.route?.discount_value || 0,
                booking.route?.discount_from_pax || 2
              ).total
            }
            existingPaymentOption={booking.payment_option || null}
            bankInfo={emailSettings ? {
              bank_name: emailSettings.bank_name,
              bank_account_name: emailSettings.bank_account_name,
              bank_account_number: emailSettings.bank_account_number,
              bank_swift_code: emailSettings.bank_swift_code,
            } : undefined}
          />
        )}

        {/* Confirmed Message */}
        {booking.status === "CONFIRMED" && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-700 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                You&apos;re All Set!
              </CardTitle>
              <CardDescription className="text-orange-600">
                Your booking is confirmed. We can&apos;t wait to see you!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Payment remaining notice */}
                {booking.payment_status === "deposit_paid" && (
                  <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg text-sm">
                    <p className="font-semibold text-yellow-800">Remaining Balance</p>
                    <p className="text-yellow-700">
                      You have paid a 50% deposit. The remaining{" "}
                      <strong>
                        {formatPrice(
                          (booking.custom_total ??
                            calculateTotalWithDiscount(
                              booking.route?.price || 0,
                              booking.pax_count,
                              booking.route?.discount_type || "none",
                              booking.route?.discount_value || 0,
                              booking.route?.discount_from_pax || 2
                            ).total) - (booking.amount_paid || 0)
                        )}
                      </strong>{" "}
                      can be paid before the tour or at check-in on the day.
                    </p>
                  </div>
                )}
                {booking.payment_option === "pay_at_venue" && booking.payment_status !== "fully_paid" && (
                  <div className="p-3 bg-blue-50 border border-blue-300 rounded-lg text-sm">
                    <p className="font-semibold text-blue-800">Pay at Venue</p>
                    <p className="text-blue-700">
                      Please bring{" "}
                      <strong>
                        {formatPrice(
                          booking.custom_total ??
                            calculateTotalWithDiscount(
                              booking.route?.price || 0,
                              booking.pax_count,
                              booking.route?.discount_type || "none",
                              booking.route?.discount_value || 0,
                              booking.route?.discount_from_pax || 2
                            ).total
                        )}
                      </strong>{" "}
                      to pay at check-in (cash or bank transfer).
                    </p>
                  </div>
                )}
                <div>
                  <p className="font-semibold">Meeting Point</p>
                  <p className="text-sm text-gray-600">
                    Mad Monkey eBike HQ, Chiang Mai
                  </p>
                  <p className="text-sm text-gray-600">
                    Please arrive 15 minutes before your start time.
                  </p>
                </div>
                <div>
                  <p className="font-semibold">What to Bring</p>
                  <ul className="text-sm text-gray-600 list-disc list-inside">
                    <li>Comfortable clothes for cycling</li>
                    <li>Sunscreen and sunglasses</li>
                    <li>Valid ID or passport</li>
                  </ul>
                </div>
                <div className="pt-2 border-t">
                  <p className="font-semibold text-sm text-red-700">Cancellation Policy</p>
                  <ul className="text-xs text-gray-600 mt-1 space-y-1">
                    <li>• 3+ days before tour: Full refund (minus bank charges & admin fee)</li>
                    <li>• Less than 3 days: 25% refund for full payment only</li>
                    <li>• No-show: No refund</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
