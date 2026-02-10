"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  approveBooking,
  confirmBooking,
  cancelBooking,
  updateBookingNotes,
} from "@/app/actions/bookings";
import type { Booking } from "@/lib/types";

interface Props {
  booking: Booking;
}

export default function BookingActions({ booking }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [notes, setNotes] = useState(booking.admin_notes || "");

  const handleApprove = async () => {
    setLoading("approve");
    const result = await approveBooking(booking.id);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Booking approved and payment request sent!" });
      router.refresh();
    }
    setLoading(null);
  };

  const handleConfirm = async () => {
    setLoading("confirm");
    const result = await confirmBooking(booking.id);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Booking confirmed!" });
      router.refresh();
    }
    setLoading(null);
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setLoading("cancel");
    const result = await cancelBooking(booking.id);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Cancelled", description: "Booking has been cancelled" });
      router.refresh();
    }
    setLoading(null);
  };

  const handleSaveNotes = async () => {
    setLoading("notes");
    const result = await updateBookingNotes(booking.id, notes);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Notes updated" });
    }
    setLoading(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {booking.status === "PENDING_REVIEW" && (
            <Button
              className="w-full"
              onClick={handleApprove}
              disabled={loading !== null}
            >
              {loading === "approve" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Approve & Request Payment
            </Button>
          )}

          {booking.status === "PAYMENT_UPLOADED" && (
            <Button
              className="w-full"
              onClick={handleConfirm}
              disabled={loading !== null}
            >
              {loading === "confirm" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Verify & Confirm Booking
            </Button>
          )}

          {booking.status !== "CONFIRMED" && booking.status !== "CANCELLED" && (
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleCancel}
              disabled={loading !== null}
            >
              {loading === "cancel" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Cancel Booking
            </Button>
          )}

          {booking.status === "CONFIRMED" && (
            <p className="text-center text-primary font-medium py-4">
              ✓ This booking is confirmed
            </p>
          )}

          {booking.status === "CANCELLED" && (
            <p className="text-center text-red-600 font-medium py-4">
              ✗ This booking was cancelled
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Admin Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Add internal notes about this booking..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={handleSaveNotes}
            disabled={loading === "notes"}
          >
            {loading === "notes" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Save Notes
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
