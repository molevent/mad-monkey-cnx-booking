"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X, Loader2, Plus, Trash2, User, Mail, Phone, Calendar, Clock, Users, Ruler } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { updateBookingDetails } from "@/app/actions/bookings";
import { formatDate, formatTime } from "@/lib/utils";
import type { Participant, Booking } from "@/lib/types";

const TIME_SLOTS = ["07:00", "08:00", "09:00", "14:00", "15:00"];
const HELMET_SIZES = ["XS", "S", "M", "L", "XL"];
const ALL_STATUSES = [
  { value: "PENDING_REVIEW", label: "Pending Review" },
  { value: "AWAITING_PAYMENT", label: "Awaiting Payment" },
  { value: "PAYMENT_UPLOADED", label: "Payment Uploaded" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "CANCELLED", label: "Cancelled" },
];

interface RouteOption {
  id: string;
  title: string;
}

interface Props {
  booking: Booking;
  routes: RouteOption[];
}

export default function BookingEditForm({ booking, routes }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  // Edit modes
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [editingTour, setEditingTour] = useState(false);
  const [editingParticipants, setEditingParticipants] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  // Customer fields
  const [customerName, setCustomerName] = useState(booking.customer_name);
  const [customerEmail, setCustomerEmail] = useState(booking.customer_email);
  const [customerWhatsapp, setCustomerWhatsapp] = useState(booking.customer_whatsapp || "");

  // Tour fields
  const [tourDate, setTourDate] = useState(booking.tour_date);
  const [startTime, setStartTime] = useState(booking.start_time);
  const [routeId, setRouteId] = useState(booking.route_id);

  // Participants
  const [participants, setParticipants] = useState<Participant[]>(
    booking.participants_info || []
  );

  // Status
  const [status, setStatus] = useState(booking.status);

  const handleSaveCustomer = async () => {
    setSaving("customer");
    const result = await updateBookingDetails(booking.id, JSON.stringify({
      customer_name: customerName,
      customer_email: customerEmail,
      customer_whatsapp: customerWhatsapp || null,
    }));
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Customer info updated." });
      setEditingCustomer(false);
      router.refresh();
    }
    setSaving(null);
  };

  const handleSaveTour = async () => {
    setSaving("tour");
    const result = await updateBookingDetails(booking.id, JSON.stringify({
      tour_date: tourDate,
      start_time: startTime,
      route_id: routeId,
    }));
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Tour details updated." });
      setEditingTour(false);
      router.refresh();
    }
    setSaving(null);
  };

  const handleSaveParticipants = async () => {
    setSaving("participants");
    const result = await updateBookingDetails(booking.id, JSON.stringify({
      pax_count: participants.length,
      participants_info: participants,
    }));
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Participant details updated." });
      setEditingParticipants(false);
      router.refresh();
    }
    setSaving(null);
  };

  const handleSaveStatus = async () => {
    setSaving("status");
    const result = await updateBookingDetails(booking.id, JSON.stringify({ status }));
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Booking status updated." });
      setEditingStatus(false);
      router.refresh();
    }
    setSaving(null);
  };

  const addParticipant = () => {
    setParticipants([...participants, { name: "", height: "", helmet_size: "M", dietary: "" }]);
  };

  const removeParticipant = (index: number) => {
    if (participants.length > 1) {
      setParticipants(participants.filter((_, i) => i !== index));
    }
  };

  const updateParticipant = (index: number, field: keyof Participant, value: string) => {
    const updated = [...participants];
    updated[index] = { ...updated[index], [field]: value };
    setParticipants(updated);
  };

  const EditButton = ({ onClick }: { onClick: () => void }) => (
    <Button variant="ghost" size="sm" className="h-7 px-2" onClick={onClick}>
      <Pencil className="h-3 w-3 mr-1" />
      <span className="text-xs">Edit</span>
    </Button>
  );

  const SaveCancelButtons = ({
    onSave,
    onCancel,
    savingKey,
  }: {
    onSave: () => void;
    onCancel: () => void;
    savingKey: string;
  }) => (
    <div className="flex gap-2 mt-4">
      <Button size="sm" onClick={onSave} disabled={saving !== null}>
        {saving === savingKey ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
        Save
      </Button>
      <Button size="sm" variant="outline" onClick={onCancel} disabled={saving !== null}>
        <X className="h-3 w-3 mr-1" />
        Cancel
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Status Change */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Booking Status</CardTitle>
            {!editingStatus && <EditButton onClick={() => setEditingStatus(true)} />}
          </div>
        </CardHeader>
        <CardContent>
          {editingStatus ? (
            <div>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <SaveCancelButtons
                onSave={handleSaveStatus}
                onCancel={() => {
                  setStatus(booking.status);
                  setEditingStatus(false);
                }}
                savingKey="status"
              />
            </div>
          ) : (
            <Badge className="text-sm px-3 py-1">
              {ALL_STATUSES.find((s) => s.value === booking.status)?.label || booking.status}
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Customer Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
            {!editingCustomer && <EditButton onClick={() => setEditingCustomer(true)} />}
          </div>
        </CardHeader>
        <CardContent>
          {editingCustomer ? (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input value={customerWhatsapp} onChange={(e) => setCustomerWhatsapp(e.target.value)} placeholder="+66 XX XXX XXXX" />
                </div>
              </div>
              <SaveCancelButtons
                onSave={handleSaveCustomer}
                onCancel={() => {
                  setCustomerName(booking.customer_name);
                  setCustomerEmail(booking.customer_email);
                  setCustomerWhatsapp(booking.customer_whatsapp || "");
                  setEditingCustomer(false);
                }}
                savingKey="customer"
              />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{booking.customer_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{booking.customer_email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">WhatsApp</p>
                  <p className="font-medium">{booking.customer_whatsapp || "Not provided"}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tour Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Tour Details
            </CardTitle>
            {!editingTour && <EditButton onClick={() => setEditingTour(true)} />}
          </div>
        </CardHeader>
        <CardContent>
          {editingTour ? (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tour Route</Label>
                  <Select value={routeId} onValueChange={setRouteId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {routes.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tour Date</Label>
                  <Input type="date" value={tourDate} onChange={(e) => setTourDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <SaveCancelButtons
                onSave={handleSaveTour}
                onCancel={() => {
                  setTourDate(booking.tour_date);
                  setStartTime(booking.start_time);
                  setRouteId(booking.route_id);
                  setEditingTour(false);
                }}
                savingKey="tour"
              />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Tour</p>
                <p className="font-medium">{booking.route?.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Difficulty</p>
                <p className="font-medium">{booking.route?.difficulty}</p>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Date</p>
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Participants */}
      <Card className="border border-orange-200">
        <CardHeader className="bg-orange-50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Users className="h-5 w-5" />
              Participants ({editingParticipants ? participants.length : booking.pax_count} riders)
            </CardTitle>
            {!editingParticipants && <EditButton onClick={() => setEditingParticipants(true)} />}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {editingParticipants ? (
            <div className="space-y-4">
              {participants.map((p, index) => (
                <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">
                      Rider {index + 1}
                      {index === 0 && <Badge variant="secondary" className="ml-2 text-xs">Lead</Badge>}
                    </h4>
                    {participants.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeParticipant(index)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Name</Label>
                      <Input
                        value={p.name}
                        onChange={(e) => updateParticipant(index, "name", e.target.value)}
                        placeholder="Full name"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Height (cm)</Label>
                      <Input
                        value={p.height}
                        onChange={(e) => updateParticipant(index, "height", e.target.value)}
                        placeholder="e.g., 175"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Helmet Size</Label>
                      <Select
                        value={p.helmet_size}
                        onValueChange={(v) => updateParticipant(index, "helmet_size", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HELMET_SIZES.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Dietary</Label>
                      <Input
                        value={p.dietary}
                        onChange={(e) => updateParticipant(index, "dietary", e.target.value)}
                        placeholder="None, Vegetarian, etc."
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={addParticipant}>
                <Plus className="h-4 w-4 mr-2" />
                Add Rider
              </Button>
              <SaveCancelButtons
                onSave={handleSaveParticipants}
                onCancel={() => {
                  setParticipants(booking.participants_info || []);
                  setEditingParticipants(false);
                }}
                savingKey="participants"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {booking.participants_info.map((participant, index) => (
                <div key={index} className="p-4 bg-white border border-gray-100 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">
                      {participant.name}
                      {index === 0 && <Badge variant="secondary" className="ml-2">Lead Guest</Badge>}
                    </h4>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-primary" />
                      <span className="text-gray-500">Height:</span>
                      <span className="font-semibold text-primary">{participant.height} cm</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Helmet:</span>
                      <span className="font-medium ml-1">{participant.helmet_size}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Dietary:</span>
                      <span className="font-medium ml-1">{participant.dietary || "None"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
