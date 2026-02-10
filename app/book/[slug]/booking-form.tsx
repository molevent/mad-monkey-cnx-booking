"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { createBooking } from "@/app/actions/bookings";
import { formatPrice, calculateTotalWithDiscount } from "@/lib/utils";
import type { Participant } from "@/lib/types";

const TIME_SLOTS = [
  "07:00",
  "08:00",
  "09:00",
  "14:00",
  "15:00",
];

const HELMET_SIZES = ["XS", "S", "M", "L", "XL"];

interface RouteInfo {
  title: string;
  price: number;
  discount_type: "none" | "fixed" | "percentage";
  discount_value: number;
  discount_from_pax: number;
}

interface Props {
  slug: string;
  route: RouteInfo;
}

export default function BookingForm({ slug, route }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    tour_date: "",
    start_time: "",
    customer_name: "",
    customer_email: "",
    customer_whatsapp: "",
  });

  const [participants, setParticipants] = useState<Participant[]>([
    { name: "", height: "", helmet_size: "M", dietary: "" },
  ]);

  const pricing = useMemo(() => {
    return calculateTotalWithDiscount(
      route.price,
      participants.length,
      route.discount_type,
      route.discount_value,
      route.discount_from_pax
    );
  }, [participants.length, route]);

  const hasDiscount = route.discount_type !== "none" && route.discount_value > 0;

  const addParticipant = () => {
    setParticipants([
      ...participants,
      { name: "", height: "", helmet_size: "M", dietary: "" },
    ]);
  };

  const removeParticipant = (index: number) => {
    if (participants.length > 1) {
      setParticipants(participants.filter((_, i) => i !== index));
    }
  };

  const updateParticipant = (
    index: number,
    field: keyof Participant,
    value: string
  ) => {
    const updated = [...participants];
    updated[index] = { ...updated[index], [field]: value };
    setParticipants(updated);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await createBooking({
        route_slug: slug,
        tour_date: formData.tour_date,
        start_time: formData.start_time,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_whatsapp: formData.customer_whatsapp,
        pax_count: participants.length,
        participants_info: participants,
      });

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Booking Submitted!",
        description: "We'll review your request and get back to you soon.",
      });

      router.push(`/track/${result.tracking_token}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isStep1Valid =
    formData.tour_date &&
    formData.start_time &&
    formData.customer_name &&
    formData.customer_email;

  const isStep2Valid = participants.every(
    (p) => p.name && p.height && p.helmet_size
  );

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= 1
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              1
            </div>
            <div
              className={`w-16 h-1 ${step >= 2 ? "bg-primary" : "bg-gray-200"}`}
            />
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= 2
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              2
            </div>
          </div>
        </div>

        {/* Step 1: Contact Details */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Details</CardTitle>
              <CardDescription>
                Tell us how to reach you for booking confirmation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tour_date">Tour Date *</Label>
                  <Input
                    id="tour_date"
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={formData.tour_date}
                    onChange={(e) =>
                      setFormData({ ...formData, tour_date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_time">Preferred Start Time *</Label>
                  <Select
                    value={formData.start_time}
                    onValueChange={(value) =>
                      setFormData({ ...formData, start_time: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="customer_name">Full Name *</Label>
                <Input
                  id="customer_name"
                  placeholder="John Doe"
                  value={formData.customer_name}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_email">Email Address *</Label>
                <Input
                  id="customer_email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.customer_email}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_email: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_whatsapp">WhatsApp Number</Label>
                <Input
                  id="customer_whatsapp"
                  placeholder="+66 XX XXX XXXX"
                  value={formData.customer_whatsapp}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customer_whatsapp: e.target.value,
                    })
                  }
                />
              </div>

              <Button
                className="w-full"
                size="lg"
                disabled={!isStep1Valid}
                onClick={() => setStep(2)}
              >
                Next: Participant Details
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Participants */}
        {step === 2 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Participant Details</CardTitle>
                <CardDescription>
                  We need heights to prepare the right bike sizes for everyone
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {participants.map((participant, index) => (
                  <div key={index} className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">
                        Rider {index + 1}
                        {index === 0 && " (Lead Guest)"}
                      </h4>
                      <div className="flex items-center gap-2">
                        {hasDiscount && index + 1 >= route.discount_from_pax && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            {route.discount_type === "fixed"
                              ? `${route.discount_value.toLocaleString()} THB off`
                              : `${route.discount_value}% off`}
                          </span>
                        )}
                        {participants.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeParticipant(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input
                          placeholder="Full name"
                          value={participant.name}
                          onChange={(e) =>
                            updateParticipant(index, "name", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Height * (cm)</Label>
                        <Input
                          placeholder="e.g., 175"
                          value={participant.height}
                          onChange={(e) =>
                            updateParticipant(index, "height", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Helmet Size *</Label>
                        <Select
                          value={participant.helmet_size}
                          onValueChange={(value) =>
                            updateParticipant(index, "helmet_size", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {HELMET_SIZES.map((size) => (
                              <SelectItem key={size} value={size}>
                                {size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Dietary Requirements</Label>
                        <Input
                          placeholder="None, Vegetarian, etc."
                          value={participant.dietary}
                          onChange={(e) =>
                            updateParticipant(index, "dietary", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={addParticipant}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Rider
                </Button>
              </CardContent>
            </Card>

            {/* Price Summary */}
            <Card className="border-primary/30 bg-orange-50/50">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {pricing.breakdown.map((item) => (
                    <div key={item.rider} className="flex justify-between text-sm">
                      <span>
                        Rider {item.rider}
                        {hasDiscount && item.rider >= route.discount_from_pax && (
                          <Tag className="inline h-3 w-3 ml-1 text-green-600" />
                        )}
                      </span>
                      <span className="font-medium">
                        {formatPrice(item.price)}
                        {hasDiscount && item.rider >= route.discount_from_pax && item.price < route.price && (
                          <span className="text-xs text-gray-400 line-through ml-2">
                            {formatPrice(route.price)}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(pricing.total)}</span>
                  </div>
                  {hasDiscount && participants.length >= route.discount_from_pax && (
                    <p className="text-xs text-green-600 text-right">
                      You save {formatPrice(route.price * participants.length - pricing.total)}!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                className="flex-1"
                size="lg"
                disabled={!isStep2Valid || loading}
                onClick={handleSubmit}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Booking Request"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
