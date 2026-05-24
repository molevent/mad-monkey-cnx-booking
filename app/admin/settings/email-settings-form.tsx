"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Building2, CreditCard, Mail, MapPin, FileText, Bell, MessageCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
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
            <p className="text-xs text-gray-500 dark:text-muted-foreground">One item per line. Each line becomes a bullet point in the email.</p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Staff Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Staff Notifications
          </CardTitle>
          <CardDescription>
            Get alerted by email and/or WhatsApp whenever a customer submits a new booking request
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-3">
            <Checkbox
              id="notify_on_new_booking"
              checked={(settings.notify_on_new_booking || "true").toLowerCase() !== "false"}
              onCheckedChange={(checked) =>
                update("notify_on_new_booking", checked ? "true" : "false")
              }
            />
            <div className="space-y-1">
              <Label htmlFor="notify_on_new_booking" className="cursor-pointer">
                Send notifications when a new booking arrives
              </Label>
              <p className="text-xs text-gray-500 dark:text-muted-foreground">
                Master switch — turn off to silence all channels below.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notification Emails</Label>
            <Textarea
              value={settings.notification_emails}
              onChange={(e) => update("notification_emails", e.target.value)}
              rows={3}
              placeholder="manager@madmonkey.com, ops@madmonkey.com, owner@madmonkey.com"
            />
            <p className="text-xs text-gray-500 dark:text-muted-foreground">
              Comma-separated list of staff emails. Each address will receive an email summary the moment a customer submits a booking request.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            WhatsApp Notifications
          </CardTitle>
          <CardDescription>
            Pick one of two ways to push new-booking alerts into WhatsApp. You can leave both blank to disable.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Option A: CallMeBot */}
          <div className="rounded-lg border border-gray-200 dark:border-border bg-gray-50 dark:bg-muted/30 p-4 space-y-4">
            <div>
              <p className="font-semibold text-sm">Option A — CallMeBot (easiest, free)</p>
              <p className="text-xs text-gray-600 dark:text-muted-foreground mt-1">
                Sends a WhatsApp message to <strong>one phone number</strong> (e.g., a shared staff phone).
                Setup:
              </p>
              <ol className="list-decimal pl-5 mt-2 text-xs text-gray-600 dark:text-muted-foreground space-y-1">
                <li>Add the contact <strong>+34 644 51 95 23</strong> to your phone</li>
                <li>From the phone that will receive alerts, send a WhatsApp message <strong>“I allow callmebot to send me messages”</strong> to that number</li>
                <li>You&apos;ll get an API key back — paste it below</li>
                <li>Full guide: <a href="https://www.callmebot.com/blog/free-api-whatsapp-messages/" target="_blank" rel="noopener noreferrer" className="text-primary underline">callmebot.com</a></li>
              </ol>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={settings.whatsapp_callmebot_phone}
                  onChange={(e) => update("whatsapp_callmebot_phone", e.target.value)}
                  placeholder="66812345678 (with country code, no + or spaces)"
                />
              </div>
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  value={settings.whatsapp_callmebot_apikey}
                  onChange={(e) => update("whatsapp_callmebot_apikey", e.target.value)}
                  placeholder="1234567"
                />
              </div>
            </div>
          </div>

          {/* Option B: Generic webhook */}
          <div className="rounded-lg border border-gray-200 dark:border-border bg-gray-50 dark:bg-muted/30 p-4 space-y-4">
            <div>
              <p className="font-semibold text-sm">Option B — Webhook (advanced, supports groups)</p>
              <p className="text-xs text-gray-600 dark:text-muted-foreground mt-1">
                We POST the booking JSON to the URL you provide. Use this to forward into a <strong>WhatsApp group</strong> via tools like:
              </p>
              <ul className="list-disc pl-5 mt-2 text-xs text-gray-600 dark:text-muted-foreground space-y-1">
                <li><a href="https://make.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">Make.com</a> — &ldquo;Webhook&rdquo; trigger → WhatsApp Business module → your group</li>
                <li><a href="https://zapier.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">Zapier</a> — &ldquo;Webhooks by Zapier&rdquo; → WhatsApp Business</li>
                <li><a href="https://n8n.io" target="_blank" rel="noopener noreferrer" className="text-primary underline">n8n</a> — Webhook node → WhatsApp/WAHA node</li>
                <li><a href="https://whapi.cloud" target="_blank" rel="noopener noreferrer" className="text-primary underline">Whapi.cloud</a> / WAHA — full group support</li>
              </ul>
            </div>
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <Input
                value={settings.whatsapp_webhook_url}
                onChange={(e) => update("whatsapp_webhook_url", e.target.value)}
                placeholder="https://hook.make.com/abc123... (leave blank to skip)"
              />
              <p className="text-xs text-gray-500 dark:text-muted-foreground">
                JSON payload: <code className="text-[11px]">{"{ type, company, text, booking, admin_url }"}</code>
              </p>
            </div>
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
            <p className="text-xs text-gray-500 dark:text-muted-foreground">Use {"{{customer_name}}"} to insert the customer&apos;s name</p>
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
            <p className="text-xs text-gray-500 dark:text-muted-foreground">Use {"{{customer_name}}"} to insert the customer&apos;s name</p>
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
            <p className="text-xs text-gray-500 dark:text-muted-foreground">Use {"{{customer_name}}"} to insert the customer&apos;s name</p>
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
