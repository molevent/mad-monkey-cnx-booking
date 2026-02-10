"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search, QrCode, CheckCircle, XCircle, Loader2, Users, Calendar, Clock, Undo2, Banknote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { lookupBookingForCheckIn, checkInBooking, undoCheckIn } from "@/app/actions/bookings";
import { formatDate, formatTime, formatPrice } from "@/lib/utils";

export default function CheckInPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-lookup if code is in URL params (from QR scan)
  useEffect(() => {
    const urlCode = searchParams.get("code");
    if (urlCode) {
      setCode(urlCode);
      handleLookup(urlCode);
    }
  }, [searchParams]);

  const handleLookup = async (lookupCode?: string) => {
    const searchCode = (lookupCode || code).trim();
    if (!searchCode) return;

    setLoading(true);
    setError(null);
    setBooking(null);

    try {
      const result = await lookupBookingForCheckIn(searchCode);
      if (result.error) {
        setError(result.error);
      } else {
        setBooking(result.booking);
      }
    } catch {
      setError("Failed to look up booking");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!booking) return;
    setCheckingIn(true);
    try {
      const result = await checkInBooking(booking.id);
      if (result.error) throw new Error(result.error);
      setBooking({ ...booking, checked_in: true, checked_in_at: new Date().toISOString() });
      toast({ title: "Checked In!", description: `${booking.customer_name} has been checked in.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCheckingIn(false);
    }
  };

  const handleUndoCheckIn = async () => {
    if (!booking) return;
    setCheckingIn(true);
    try {
      const result = await undoCheckIn(booking.id);
      if (result.error) throw new Error(result.error);
      setBooking({ ...booking, checked_in: false, checked_in_at: null });
      toast({ title: "Undone", description: "Check-in has been reversed." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCheckingIn(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLookup();
  };

  const getPaymentLabel = () => {
    if (!booking) return "";
    if (booking.payment_status === "fully_paid") return "ชำระครบแล้ว";
    if (booking.payment_status === "deposit_paid") return "มัดจำแล้ว — เหลืองวดสุดท้าย";
    if (booking.payment_option === "pay_at_venue") return "ชำระหน้างาน";
    return "ยังไม่ชำระ";
  };

  const getPaymentBadgeClass = () => {
    if (!booking) return "";
    if (booking.payment_status === "fully_paid") return "bg-green-100 text-green-800";
    if (booking.payment_status === "deposit_paid") return "bg-yellow-100 text-yellow-800";
    if (booking.payment_option === "pay_at_venue") return "bg-blue-100 text-blue-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Check-In</h1>
          <p className="text-gray-500">Scan QR code or enter booking reference</p>
        </div>
        <QrCode className="h-10 w-10 text-primary" />
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Enter booking reference or scan QR code..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-12 text-lg"
                autoFocus
              />
            </div>
            <Button onClick={() => handleLookup()} disabled={loading || !code.trim()} className="h-12 px-6">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-700">
              <XCircle className="h-6 w-6" />
              <div>
                <p className="font-semibold">Booking Not Found</p>
                <p className="text-sm">Please check the code and try again.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Booking Result */}
      {booking && (
        <Card className={booking.checked_in ? "border-green-300 bg-green-50/50" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{booking.customer_name}</CardTitle>
                <CardDescription>{booking.customer_email}</CardDescription>
              </div>
              {booking.checked_in ? (
                <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Checked In
                </Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-600 text-lg px-4 py-2">
                  Not Checked In
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Booking Status */}
            <div className="flex gap-2 flex-wrap">
              <Badge className={
                booking.status === "CONFIRMED" ? "bg-orange-100 text-orange-800" :
                booking.status === "CANCELLED" ? "bg-red-100 text-red-800" :
                "bg-gray-100 text-gray-800"
              }>
                {booking.status === "CONFIRMED" ? "Confirmed" :
                 booking.status === "CANCELLED" ? "Cancelled" : booking.status}
              </Badge>
              <Badge className={getPaymentBadgeClass()}>
                <Banknote className="h-3 w-3 mr-1" />
                {getPaymentLabel()}
              </Badge>
            </div>

            {booking.status === "CANCELLED" && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                This booking has been cancelled and should not be checked in.
              </div>
            )}

            <Separator />

            {/* Booking Details */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Tour Date</p>
                  <p className="font-medium">{formatDate(booking.tour_date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Start Time</p>
                  <p className="font-medium">{formatTime(booking.start_time)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Riders</p>
                  <p className="font-medium">{booking.pax_count} person(s)</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Route</p>
                <p className="font-medium">{booking.route?.title || "—"}</p>
              </div>
            </div>

            {/* Participants */}
            {Array.isArray(booking.participants_info) && booking.participants_info.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="font-semibold text-sm mb-2">Participants</p>
                  <div className="space-y-2">
                    {booking.participants_info.map((p: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <span className="font-medium">
                          {i + 1}. {p.name}
                          {i === 0 && <span className="text-gray-400 ml-1">(Lead)</span>}
                        </span>
                        <span className="text-gray-500">
                          {p.height}cm · Helmet {p.helmet_size}
                          {p.dietary ? ` · ${p.dietary}` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Payment Info */}
            {booking.payment_status !== "fully_paid" && booking.payment_option !== null && (
              <>
                <Separator />
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                  <p className="font-semibold text-yellow-800 flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    Payment Collection Required
                  </p>
                  {booking.payment_status === "deposit_paid" && (
                    <p className="text-yellow-700 mt-1">
                      Remaining balance: <strong>{formatPrice((booking.custom_total || booking.route?.price * booking.pax_count) - (booking.amount_paid || 0))}</strong>
                    </p>
                  )}
                  {booking.payment_option === "pay_at_venue" && booking.payment_status === "unpaid" && (
                    <p className="text-yellow-700 mt-1">
                      Collect full amount: <strong>{formatPrice(booking.custom_total || booking.route?.price * booking.pax_count)}</strong>
                    </p>
                  )}
                </div>
              </>
            )}

            <Separator />

            {/* Check-in Actions */}
            {booking.checked_in ? (
              <div className="space-y-3">
                <div className="text-center py-4">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-green-700 font-bold text-lg">Already Checked In</p>
                  {booking.checked_in_at && (
                    <p className="text-sm text-gray-500">
                      at {new Date(booking.checked_in_at).toLocaleString()}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleUndoCheckIn}
                  disabled={checkingIn}
                >
                  {checkingIn ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Undo2 className="h-4 w-4 mr-2" />}
                  Undo Check-In
                </Button>
              </div>
            ) : booking.status === "CONFIRMED" ? (
              <Button
                className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
                onClick={handleCheckIn}
                disabled={checkingIn}
              >
                {checkingIn ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-5 w-5 mr-2" />
                )}
                Check In Now
              </Button>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p>This booking is not confirmed yet and cannot be checked in.</p>
              </div>
            )}

            {/* Clear / New Search */}
            <Button
              variant="ghost"
              className="w-full text-gray-500"
              onClick={() => { setBooking(null); setCode(""); setError(null); }}
            >
              Search Another Booking
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
