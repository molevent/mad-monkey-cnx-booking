"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2, Banknote, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
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
import { markPaymentStatus } from "@/app/actions/bookings";
import { formatPrice } from "@/lib/utils";

interface Props {
  bookingId: string;
  totalAmount: number;
  paymentOption: string | null;
  paymentStatus: string;
  amountPaid: number;
}

export default function PaymentStatus({
  bookingId,
  totalAmount,
  paymentOption,
  paymentStatus,
  amountPaid,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showFullPayDialog, setShowFullPayDialog] = useState(false);

  const depositAmount = Math.ceil(totalAmount * 0.5);
  const remaining = totalAmount - amountPaid;

  const handleMarkDeposit = async () => {
    setShowDepositDialog(false);
    setLoading("deposit");
    try {
      const result = await markPaymentStatus(bookingId, "deposit_paid", depositAmount);
      if (result.error) throw new Error(result.error);
      toast({ title: "Updated", description: "Marked as deposit paid" });
      router.refresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const handleMarkFullyPaid = async () => {
    setShowFullPayDialog(false);
    setLoading("full");
    try {
      const result = await markPaymentStatus(bookingId, "fully_paid", totalAmount);
      if (result.error) throw new Error(result.error);
      toast({ title: "Updated", description: "Marked as fully paid" });
      router.refresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const getStatusBadge = () => {
    switch (paymentStatus) {
      case "fully_paid":
        return <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1">ชำระครบแล้ว</Badge>;
      case "deposit_paid":
        return <Badge className="bg-yellow-100 text-yellow-800 text-sm px-3 py-1">มัดจำแล้ว — เหลืองวดสุดท้าย</Badge>;
      default:
        return <Badge className="bg-red-100 text-red-800 text-sm px-3 py-1">ยังไม่ชำระ</Badge>;
    }
  };

  const getOptionLabel = () => {
    switch (paymentOption) {
      case "deposit_50": return "มัดจำ 50%";
      case "full_100": return "ชำระเต็มจำนวน 100%";
      case "pay_at_venue": return "ชำระหน้างาน";
      default: return "ยังไม่เลือก";
    }
  };

  return (
    <>
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Banknote className="h-5 w-5" />
          Payment Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="text-center">
          {getStatusBadge()}
        </div>

        <Separator />

        {/* Payment Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-muted-foreground">Payment Option</span>
            <span className="font-medium">{getOptionLabel()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-muted-foreground">Total Amount</span>
            <span className="font-medium">{formatPrice(totalAmount)}</span>
          </div>
          {paymentOption === "deposit_50" && (
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-muted-foreground">Deposit (50%)</span>
              <span className="font-medium">{formatPrice(depositAmount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-muted-foreground">Amount Paid</span>
            <span className="font-bold text-green-600">{formatPrice(amountPaid)}</span>
          </div>
          {remaining > 0 && paymentStatus !== "fully_paid" && (
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-muted-foreground">Remaining</span>
              <span className="font-bold text-red-600">{formatPrice(remaining)}</span>
            </div>
          )}
        </div>

        {paymentOption === "pay_at_venue" && paymentStatus !== "fully_paid" && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-blue-700">Customer chose to pay at venue. Please collect {formatPrice(totalAmount)} at check-in.</p>
          </div>
        )}

        <Separator />

        {/* Mark Paid Buttons */}
        {paymentStatus !== "fully_paid" && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 dark:text-muted-foreground font-medium uppercase">Mark Payment</p>

            {paymentStatus !== "deposit_paid" && paymentOption === "deposit_50" && (
              <Button
                variant="outline"
                className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                onClick={() => setShowDepositDialog(true)}
                disabled={loading !== null}
              >
                {loading === "deposit" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Mark Deposit Paid ({formatPrice(depositAmount)})
              </Button>
            )}

            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => setShowFullPayDialog(true)}
              disabled={loading !== null}
            >
              {loading === "full" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Mark Fully Paid ({formatPrice(totalAmount)})
            </Button>
          </div>
        )}

        {paymentStatus === "fully_paid" && (
          <div className="text-center py-2">
            <p className="text-green-600 font-semibold flex items-center justify-center gap-2">
              <CheckCircle className="h-5 w-5" />
              ชำระครบแล้ว — Fully Paid
            </p>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Mark Deposit Paid Dialog */}
    <AlertDialog open={showDepositDialog} onOpenChange={setShowDepositDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-yellow-600" />
            Mark Deposit Paid?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will mark the booking as deposit paid with amount <strong className="text-foreground">{formatPrice(depositAmount)}</strong>. Are you sure?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleMarkDeposit} className="bg-yellow-600 hover:bg-yellow-700 text-white">
            Yes, Mark Deposit Paid
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Mark Fully Paid Dialog */}
    <AlertDialog open={showFullPayDialog} onOpenChange={setShowFullPayDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Mark Fully Paid?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will mark the booking as fully paid with amount <strong className="text-foreground">{formatPrice(totalAmount)}</strong>. Are you sure?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleMarkFullyPaid} className="bg-green-600 hover:bg-green-700 text-white">
            Yes, Mark Fully Paid
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
