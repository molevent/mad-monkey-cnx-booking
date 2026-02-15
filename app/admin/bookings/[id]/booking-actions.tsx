"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Send, Loader2, Trash2, AlertTriangle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  approveBooking,
  confirmBooking,
  cancelBooking,
  updateBookingNotes,
  deleteBooking,
  sendBookingDetailsEmail,
  resendPaymentEmail,
} from "@/app/actions/bookings";
import type { Booking } from "@/lib/types";

interface Props {
  booking: Booking;
}

export default function BookingActions({ booking }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();
  const [loading, setLoading] = useState<string | null>(null);
  const [notes, setNotes] = useState(booking.admin_notes || "");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showResendPaymentDialog, setShowResendPaymentDialog] = useState(false);
  const [showSendEmailDialog, setShowSendEmailDialog] = useState(false);

  const handleApprove = async () => {
    setShowApproveDialog(false);
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
    setShowConfirmDialog(false);
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

  const handleCancelBooking = async () => {
    setShowCancelDialog(false);
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

  const handleDeleteBooking = async () => {
    setShowDeleteDialog(false);
    setLoading("delete");
    const result = await deleteBooking(booking.id);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      setLoading(null);
    } else {
      toast({ title: "Deleted", description: `Booking for ${result.deleted?.customer_name} has been permanently deleted.` });
      router.push("/admin/bookings");
    }
  };

  const handleSendEmail = async () => {
    setShowSendEmailDialog(false);
    setLoading("email");
    const result = await sendBookingDetailsEmail(booking.id);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Email Sent", description: `Booking details sent to ${result.email}` });
    }
    setLoading(null);
  };

  const handleResendPaymentEmail = async () => {
    setShowResendPaymentDialog(false);
    setLoading("payment_email");
    const result = await resendPaymentEmail(booking.id);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Email Sent", description: `Payment request email sent to ${result.email}` });
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
          <CardTitle>{t("admin.actions")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {booking.status === "PENDING_REVIEW" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="w-full"
                  onClick={() => setShowApproveDialog(true)}
                  disabled={loading !== null}
                >
                  {loading === "approve" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {t("admin.approve")}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("tip.approve")}</TooltipContent>
            </Tooltip>
          )}

          {booking.status === "AWAITING_PAYMENT" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowResendPaymentDialog(true)}
                  disabled={loading !== null}
                >
                  {loading === "payment_email" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Resend Payment Request Email
                </Button>
              </TooltipTrigger>
              <TooltipContent>Resend payment request email with tracking link to customer</TooltipContent>
            </Tooltip>
          )}

          {booking.status === "PAYMENT_UPLOADED" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="w-full"
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={loading !== null}
                >
                  {loading === "confirm" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {t("admin.confirm")}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("tip.confirm")}</TooltipContent>
            </Tooltip>
          )}

          {booking.status !== "CONFIRMED" && booking.status !== "CANCELLED" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setShowCancelDialog(true)}
                  disabled={loading !== null}
                >
                  {loading === "cancel" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  {t("admin.cancel")}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("tip.cancel")}</TooltipContent>
            </Tooltip>
          )}

          {booking.status === "CONFIRMED" && (
            <p className="text-center text-primary font-medium py-4">
              ✓ {t("admin.booking_confirmed")}
            </p>
          )}

          {booking.status === "CANCELLED" && (
            <p className="text-center text-red-600 font-medium py-4">
              ✗ {t("admin.booking_cancelled")}
            </p>
          )}

          <div className="border-t pt-3 mt-3 space-y-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowSendEmailDialog(true)}
                  disabled={loading !== null}
                >
                  {loading === "email" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Send Booking Details Email
                </Button>
              </TooltipTrigger>
              <TooltipContent>Resend booking details email to customer</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-700"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={loading !== null}
                >
                  {loading === "delete" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  {t("admin.delete_permanently")}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{t("tip.delete")}</TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>

      {/* Approve Booking Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Approve Booking?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will approve the booking for <strong className="text-foreground">{booking.customer_name}</strong> and send a payment request email to <strong className="text-foreground">{booking.customer_email}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>
              Yes, Approve & Send Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Booking Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Confirm Booking?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will confirm the booking for <strong className="text-foreground">{booking.customer_name}</strong> and send a confirmation email to <strong className="text-foreground">{booking.customer_email}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} className="bg-green-600 hover:bg-green-700 text-white">
              Yes, Confirm Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Resend Payment Email Dialog */}
      <AlertDialog open={showResendPaymentDialog} onOpenChange={setShowResendPaymentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Resend Payment Request Email?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will resend the payment request email with tracking link to <strong className="text-foreground">{booking.customer_email}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResendPaymentEmail}>
              Yes, Send Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send Booking Details Email Dialog */}
      <AlertDialog open={showSendEmailDialog} onOpenChange={setShowSendEmailDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Send Booking Details Email?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will send the booking details email to <strong className="text-foreground">{booking.customer_email}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendEmail}>
              Yes, Send Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Booking Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              {t("admin.cancel_confirm_title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.cancel_confirm_desc")} <strong className="text-foreground">{booking.customer_name}</strong>?
              {t("admin.cancel_confirm_note")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.keep_booking")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelBooking}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {t("admin.yes_cancel")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Booking Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              {t("admin.delete_confirm_title")}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                {t("admin.delete_confirm_desc")} <strong className="text-foreground">{booking.customer_name}</strong>.
              </span>
              <span className="block text-red-600 font-medium">
                {t("admin.delete_confirm_warning")}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.cancel_edit")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBooking}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("admin.delete_confirm_btn")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.notes")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder={t("admin.notes_placeholder")}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleSaveNotes}
                disabled={loading === "notes"}
              >
                {loading === "notes" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {t("admin.save_notes")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("tip.save_notes")}</TooltipContent>
          </Tooltip>
        </CardContent>
      </Card>
    </>
  );
}
