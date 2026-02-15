"use client";

import { useState } from "react";
import { Clock, CreditCard, FileSignature, CheckCircle, AlertCircle, Globe, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/lib/i18n/context";
import { bookingLocales, localeNames } from "@/lib/i18n/translations";
import type { Locale } from "@/lib/i18n/translations";
import { formatDate, formatTime, formatPrice, getStatusColor, getStatusLabel, calculateTotalWithDiscount } from "@/lib/utils";
import PaymentWaiverForm from "./payment-waiver-form";
import type { Participant, WaiverInfo } from "@/lib/types";

interface BankInfo {
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_swift_code: string;
}

interface BookingData {
  id: string;
  status: string;
  tour_date: string;
  start_time: string;
  customer_name: string;
  pax_count: number;
  custom_total: number | null;
  payment_option: string | null;
  payment_status: string | null;
  amount_paid: number | null;
  checked_in: boolean;
  participants_info: Participant[];
  waiver_info: WaiverInfo[] | null;
  tracking_token: string;
  route: {
    title: string;
    price: number;
    discount_type: string | null;
    discount_value: number | null;
    discount_from_pax: number | null;
  } | null;
}

interface Props {
  booking: BookingData;
  bankInfo?: BankInfo;
}

function getStatusStep(status: string): number {
  switch (status) {
    case "PENDING_REVIEW": return 1;
    case "AWAITING_PAYMENT": return 2;
    case "PAYMENT_UPLOADED": return 4;
    case "CONFIRMED": return 5;
    default: return 1;
  }
}

export default function TrackingClient({ booking, bankInfo }: Props) {
  const { locale, setLocale, t } = useI18n();

  const currentStep = getStatusStep(booking.status);
  const showPaymentForm = booking.status === "AWAITING_PAYMENT";
  const showWaiverForm = booking.status === "PAYMENT_UPLOADED";

  const totalAmount = booking.custom_total ?? calculateTotalWithDiscount(
    booking.route?.price || 0,
    booking.pax_count,
    (booking.route?.discount_type as "none" | "fixed" | "percentage") || "none",
    booking.route?.discount_value || 0,
    booking.route?.discount_from_pax || 2
  ).total;

  const steps = [
    { step: 1, icon: Clock, title: t("track.status_submitted"), description: t("track.status_submitted_desc") },
    { step: 2, icon: CreditCard, title: t("track.status_payment"), description: t("track.status_payment_desc") },
    { step: 3, icon: FileSignature, title: t("pay.step_waivers"), description: t("track.status_waivers_desc") },
    { step: 4, icon: Upload, title: t("track.status_uploaded"), description: t("track.status_uploaded_desc") },
    { step: 5, icon: CheckCircle, title: t("track.status_confirmed"), description: t("track.status_confirmed_desc") },
  ];

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Language Switcher */}
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
            <Globe className="h-4 w-4 text-gray-500 ml-2" />
            {bookingLocales.map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  locale === l
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {localeNames[l]}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{t("track.title")}</h1>
          <p className="text-gray-600">
            {t("track.booking_id")}: <span className="font-mono">{booking.id.slice(0, 8)}</span>
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
                          className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-2 ${
                            isCompleted || isCurrent
                              ? "bg-primary text-white"
                              : "bg-gray-200 text-gray-400"
                          }`}
                        >
                          <Icon className="h-5 w-5 md:h-6 md:w-6" />
                        </div>
                        <p
                          className={`text-[10px] md:text-sm font-medium text-center leading-tight ${
                            isCompleted || isCurrent ? "text-gray-900" : "text-gray-400"
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
                          className={`absolute top-5 md:top-6 left-1/2 w-full h-0.5 ${
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
                  <h3 className="font-semibold text-red-700">{t("track.cancelled")}</h3>
                  <p className="text-sm text-red-600">{t("track.cancelled_desc")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Booking Details */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("track.booking_details")}</CardTitle>
              <Badge className={getStatusColor(booking.status)}>
                {getStatusLabel(booking.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">{t("track.tour")}</p>
                <p className="font-semibold">{booking.route?.title || "Tour"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("track.date_time")}</p>
                <p className="font-semibold">
                  {formatDate(booking.tour_date)}{" "}
                  {formatTime(booking.start_time) !== "To be confirmed" && `at ${formatTime(booking.start_time)}`}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("track.lead_guest")}</p>
                <p className="font-semibold">{booking.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("track.riders")}</p>
                <p className="font-semibold">{booking.pax_count} {t("track.persons")}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-gray-500 mb-2">{t("track.total_amount")}</p>
              <p className="text-2xl font-bold text-primary">{formatPrice(totalAmount)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Payment & Waiver Form */}
        {showPaymentForm && (
          <PaymentWaiverForm
            bookingId={booking.id}
            trackingToken={booking.tracking_token}
            participants={booking.participants_info}
            existingWaivers={booking.waiver_info || null}
            totalAmount={totalAmount}
            existingPaymentOption={booking.payment_option || null}
            tourDate={booking.tour_date}
            section="payment"
            bankInfo={bankInfo}
          />
        )}

        {/* Waiver Form (after payment uploaded) */}
        {showWaiverForm && (
          <PaymentWaiverForm
            bookingId={booking.id}
            trackingToken={booking.tracking_token}
            participants={booking.participants_info}
            existingWaivers={booking.waiver_info || null}
            totalAmount={totalAmount}
            existingPaymentOption={booking.payment_option || null}
            tourDate={booking.tour_date}
            section="waivers"
          />
        )}

        {/* Confirmed Message */}
        {booking.status === "CONFIRMED" && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-700 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                {t("track.confirmed_title")}
              </CardTitle>
              <CardDescription className="text-orange-600">
                {t("track.confirmed_desc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {booking.payment_status === "deposit_paid" && (
                  <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg text-sm">
                    <p className="font-semibold text-yellow-800">{t("track.remaining_balance")}</p>
                    <p className="text-yellow-700">
                      {t("track.deposit_paid_msg")}{" "}
                      <strong>{formatPrice(totalAmount - (booking.amount_paid || 0))}</strong>{" "}
                      {t("track.deposit_remaining_msg")}
                    </p>
                  </div>
                )}
                <div>
                  <p className="font-semibold">{t("track.meeting_point")}</p>
                  <p className="text-sm text-gray-600">{t("track.meeting_point_location")}</p>
                  <p className="text-sm text-gray-600">{t("track.arrive_early")}</p>
                </div>
                <div>
                  <p className="font-semibold">{t("track.what_to_bring")}</p>
                  <ul className="text-sm text-gray-600 list-disc list-inside">
                    <li>{t("track.bring_clothes")}</li>
                    <li>{t("track.bring_sunscreen")}</li>
                    <li>{t("track.bring_id")}</li>
                  </ul>
                </div>
                <div className="pt-2 border-t">
                  <p className="font-semibold text-sm text-red-700">{t("track.cancellation_policy")}</p>
                  <ul className="text-xs text-gray-600 mt-1 space-y-1">
                    <li>• {t("track.cancel_3days")}</li>
                    <li>• {t("track.cancel_less3")}</li>
                    <li>• {t("track.cancel_noshow")}</li>
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
