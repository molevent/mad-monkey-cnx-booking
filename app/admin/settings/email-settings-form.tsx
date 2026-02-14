"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Building2, CreditCard, Mail, MapPin, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { updateEmailSettings } from "@/app/actions/email-settings";
import type { EmailSettings } from "@/lib/email/templates";

interface Props {
  initialSettings: EmailSettings;
}

export default function EmailSettingsForm({ initialSettings }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<EmailSettings>(initialSettings);

  const update = (key: keyof EmailSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    const result = await updateEmailSettings(settings);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Email settings updated successfully." });
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Company Information
          </CardTitle>
          <CardDescription>
            These details appear in all email notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input
                value={settings.company_name}
                onChange={(e) => update("company_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Company Email</Label>
              <Input
                type="email"
                value={settings.company_email}
                onChange={(e) => update("company_email", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Company Address</Label>
              <Input
                value={settings.company_address}
                onChange={(e) => update("company_address", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={settings.company_phone}
                onChange={(e) => update("company_phone", e.target.value)}
                placeholder="+66 XX XXX XXXX"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>WhatsApp Number</Label>
              <Input
                value={settings.company_whatsapp}
                onChange={(e) => update("company_whatsapp", e.target.value)}
                placeholder="+66 XX XXX XXXX (shown in emails if set)"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Bank Transfer Details
          </CardTitle>
          <CardDescription>
            Shown in the payment request email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bank Name</Label>
              <Input
                value={settings.bank_name}
                onChange={(e) => update("bank_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Account Name</Label>
              <Input
                value={settings.bank_account_name}
                onChange={(e) => update("bank_account_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input
                value={settings.bank_account_number}
                onChange={(e) => update("bank_account_number", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>SWIFT Code</Label>
              <Input
                value={settings.bank_swift_code}
                onChange={(e) => update("bank_swift_code", e.target.value)}
                placeholder="e.g., SICOQHBK"
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Deadline</Label>
              <Input
                value={settings.payment_deadline}
                onChange={(e) => update("payment_deadline", e.target.value)}
                placeholder="e.g., 48 hours"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meeting Point */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Meeting Point & What to Bring
          </CardTitle>
          <CardDescription>
            Shown in the confirmation email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Meeting Point Address</Label>
            <Input
              value={settings.meeting_point}
              onChange={(e) => update("meeting_point", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Google Maps URL</Label>
            <Input
              value={settings.meeting_point_map_url}
              onChange={(e) => update("meeting_point_map_url", e.target.value)}
              placeholder="https://maps.google.com/?q=..."
            />
          </div>
          <div className="space-y-2">
            <Label>What to Bring</Label>
            <Textarea
              value={settings.what_to_bring}
              onChange={(e) => update("what_to_bring", e.target.value)}
              rows={4}
              placeholder="One item per line"
            />
            <p className="text-xs text-gray-500">One item per line. Each line becomes a bullet point in the email.</p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Email 1: Acknowledgement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Email 1: Booking Acknowledgement
          </CardTitle>
          <CardDescription>
            Sent automatically when a customer submits a booking request
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Subject Line</Label>
            <Input
              value={settings.acknowledgement_subject}
              onChange={(e) => update("acknowledgement_subject", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Heading</Label>
            <Input
              value={settings.acknowledgement_heading}
              onChange={(e) => update("acknowledgement_heading", e.target.value)}
            />
            <p className="text-xs text-gray-500">Use {"{{customer_name}}"} to insert the customer&apos;s name</p>
          </div>
          <div className="space-y-2">
            <Label>Body Text</Label>
            <Textarea
              value={settings.acknowledgement_body}
              onChange={(e) => update("acknowledgement_body", e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Email 2: Payment Request */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Email 2: Payment Request
          </CardTitle>
          <CardDescription>
            Sent when an admin approves a booking and requests payment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Subject Line</Label>
            <Input
              value={settings.payment_subject}
              onChange={(e) => update("payment_subject", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Heading</Label>
            <Input
              value={settings.payment_heading}
              onChange={(e) => update("payment_heading", e.target.value)}
            />
            <p className="text-xs text-gray-500">Use {"{{customer_name}}"} to insert the customer&apos;s name</p>
          </div>
          <div className="space-y-2">
            <Label>Body Text</Label>
            <Textarea
              value={settings.payment_body}
              onChange={(e) => update("payment_body", e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Email 3: Confirmation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Email 3: Booking Confirmation
          </CardTitle>
          <CardDescription>
            Sent when an admin confirms a booking after payment verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Subject Line</Label>
            <Input
              value={settings.confirmation_subject}
              onChange={(e) => update("confirmation_subject", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Heading</Label>
            <Input
              value={settings.confirmation_heading}
              onChange={(e) => update("confirmation_heading", e.target.value)}
            />
            <p className="text-xs text-gray-500">Use {"{{customer_name}}"} to insert the customer&apos;s name</p>
          </div>
          <div className="space-y-2">
            <Label>Body Text</Label>
            <Textarea
              value={settings.confirmation_body}
              onChange={(e) => update("confirmation_body", e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pb-8">
        <Button size="lg" onClick={handleSave} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save All Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
