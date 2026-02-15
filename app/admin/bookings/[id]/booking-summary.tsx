"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { updateBookingTotal } from "@/app/actions/bookings";
import { formatPrice } from "@/lib/utils";

interface Props {
  bookingId: string;
  calculatedTotal: number;
  customTotal: number | null;
  pricePerPerson: number;
  paxCount: number;
  createdAt: string;
}

export default function BookingSummary({
  bookingId,
  calculatedTotal,
  customTotal,
  pricePerPerson,
  paxCount,
  createdAt,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editValue, setEditValue] = useState<string>(
    (customTotal ?? calculatedTotal).toString()
  );

  const effectiveTotal = customTotal ?? calculatedTotal;
  const isCustom = customTotal !== null && customTotal !== calculatedTotal;

  const handleSave = async () => {
    const value = parseFloat(editValue);
    if (isNaN(value) || value < 0) {
      toast({ title: "Invalid", description: "Please enter a valid amount.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      // If the value matches the calculated total, clear custom_total
      const newCustomTotal = value === calculatedTotal ? null : value;
      const result = await updateBookingTotal(bookingId, newCustomTotal);
      if (result.error) throw new Error(result.error);

      toast({ title: "Saved", description: "Total amount updated." });
      setEditing(false);
      router.refresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue((customTotal ?? calculatedTotal).toString());
    setEditing(false);
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      const result = await updateBookingTotal(bookingId, null);
      if (result.error) throw new Error(result.error);
      toast({ title: "Reset", description: "Total reset to calculated amount." });
      setEditValue(calculatedTotal.toString());
      setEditing(false);
      router.refresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-gray-500 dark:text-muted-foreground">Total Amount</p>
            {!editing && (
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setEditing(true)}>
                <Pencil className="h-3 w-3 mr-1" />
                <span className="text-xs">Edit</span>
              </Button>
            )}
          </div>

          {editing ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500 dark:text-muted-foreground">THB</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="h-9"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={saving} className="flex-1">
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel} disabled={saving}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
              {isCustom && (
                <Button size="sm" variant="ghost" onClick={handleReset} disabled={saving} className="w-full text-xs text-gray-500 dark:text-muted-foreground">
                  Reset to calculated ({formatPrice(calculatedTotal)})
                </Button>
              )}
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-primary">
                {formatPrice(effectiveTotal)}
              </p>
              <p className="text-sm text-gray-500 dark:text-muted-foreground">
                {formatPrice(pricePerPerson)} x {paxCount} riders
                {isCustom && (
                  <span className="text-orange-500 ml-1">(adjusted)</span>
                )}
              </p>
            </>
          )}
        </div>
        <Separator />
        <div>
          <p className="text-sm text-gray-500 dark:text-muted-foreground">Created</p>
          <p className="font-medium" suppressHydrationWarning>
            {new Date(createdAt).toLocaleString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
