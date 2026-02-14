"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import SignatureCanvas from "react-signature-canvas";
import { Upload, FileSignature, Loader2, Check, Trash2, AlertTriangle, Mail, CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { uploadPaymentSlip, uploadWaiverSignature } from "@/app/actions/uploads";
import { saveWaiverInfo, sendWaiverEmailToParticipant, setPaymentOption } from "@/app/actions/bookings";
import { formatPrice } from "@/lib/utils";
import type { Participant, WaiverInfo } from "@/lib/types";

interface BankInfo {
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_swift_code: string;
}

interface Props {
  bookingId: string;
  trackingToken: string;
  participants: Participant[];
  existingWaivers: WaiverInfo[] | null;
  totalAmount: number;
  existingPaymentOption: string | null;
  bankInfo?: BankInfo;
}

const WAIVER_TEXT = [
  "I the undersigned, accept full responsibility for the rented MTB Bike while in my possession. I also agree to reimburse Mad Monkey Chiangmai for any theft, loss or damages, other than reasonable wear and tear resulting from normal use.",
  "I verify that I am familiar with the proper use of the bicycle listed on this form including use of brakes, gear shifting, and dropper seat post. I have inspected same, and it is in good conditions and working order.",
  "I understand that mountain biking is a Hazardous Activity. Further, I recognise that there are risks, inherent and others, including but not limited to, steep and narrow trails, roads, man made obstacles, jumps and other features, natural variations in terrain, bumps, stumps, ruts, forrest growth, debris, rock and other hazards and obstacles including vehicles and other users and varying weather conditions. I further realise that falls and collisions which may cause injuries or death can occur. I agree to Assume All Risk And Responsibility for myself for such incidents and injuries.",
  "I AGREE TO RELEASE FROM ANY LEGAL LIABILITY, IDEMNIFY, DEFEND HOLD HARMLESS AND NEVER SUE MAD MONKEY CHIANG MAI special events organisers, sponsors and all of their directors, officers, partners, investors, shareholders, members, agent, employees, and affiliated company for any injury or damage to person or property, including negligence.",
  "I understand that Helmets are required and I agree to wear my helmet at all times. I understand that while helmet is a necessary equipment to help protect against injuries, it does not guarantee the elimination of risk on injury or death.",
  "I agree to remain on guided trails at all times. I understand that if I become lost, I maybe held responsible for cost of search and rescue. I also understand that if I ride on public road, I am responsible for following all traffic laws and rules.",
  "I confirmed that I have read and understood this agreement and understand that this is a contract that limits my legal rights and that it is binding upon me, my heirs and legal representative. I understand that this agreement is based on the interpreted under the Thailand Law. If any clause is found to be invalid the balance of the contract will remain in effect and will be valid and enforceable.",
];

interface ParticipantWaiverState {
  name: string;
  passportNo: string;
  date: string;
  email: string;
  agreed: boolean;
  signed: boolean;
  signLater: boolean;
  sendingEmail: boolean;
  emailSent: boolean;
  saving: boolean;
  completed: boolean;
}

export default function PaymentWaiverForm({ bookingId, trackingToken, participants, existingWaivers, totalAmount, existingPaymentOption, bankInfo }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const signatureRefs = useRef<(SignatureCanvas | null)[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [paymentSlip, setPaymentSlip] = useState<File | null>(null);
  const [paymentUploaded, setPaymentUploaded] = useState(false);
  const [paymentOption, setPaymentOptionState] = useState<string | null>(existingPaymentOption);
  const [settingOption, setSettingOption] = useState(false);

  const depositAmount = Math.ceil(totalAmount * 0.5);
  const remainingAmount = totalAmount - depositAmount;

  const handleSelectPaymentOption = async (option: 'deposit_50' | 'full_100' | 'pay_at_venue') => {
    setSettingOption(true);
    try {
      const result = await setPaymentOption(bookingId, option);
      if (result.error) throw new Error(result.error);
      setPaymentOptionState(option);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSettingOption(false);
    }
  };

  // Initialize per-participant state
  const [waiverStates, setWaiverStates] = useState<ParticipantWaiverState[]>(
    participants.map((p, i) => {
      const existing = existingWaivers?.find((w) => w.participant_index === i);
      return {
        name: existing?.signer_name || p.name || "",
        passportNo: existing?.passport_no || "",
        date: existing?.date || new Date().toISOString().split("T")[0],
        email: existing?.email || "",
        agreed: !!existing?.signed,
        signed: !!existing?.signed,
        signLater: false,
        sendingEmail: false,
        emailSent: false,
        saving: false,
        completed: !!existing?.signed,
      };
    })
  );

  const updateWaiverState = (index: number, updates: Partial<ParticipantWaiverState>) => {
    setWaiverStates((prev) => prev.map((s, i) => (i === index ? { ...s, ...updates } : s)));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Please upload an image under 5MB", variant: "destructive" });
        return;
      }
      setPaymentSlip(file);
    }
  };

  const handleSignWaiver = async (index: number) => {
    const state = waiverStates[index];
    if (!state.name.trim() || !state.passportNo.trim() || !state.email.trim()) {
      toast({ title: "Missing Info", description: "Please fill in Name, Passport No, and Email.", variant: "destructive" });
      return;
    }
    if (!state.agreed) {
      toast({ title: "Agreement Required", description: "Please agree to the waiver terms.", variant: "destructive" });
      return;
    }

    const sigCanvas = signatureRefs.current[index];
    if (!sigCanvas || sigCanvas.isEmpty()) {
      toast({ title: "Signature Required", description: "Please sign the waiver.", variant: "destructive" });
      return;
    }

    updateWaiverState(index, { saving: true });

    try {
      // Upload signature
      const signatureData = sigCanvas.toDataURL("image/png");
      const sigResult = await uploadWaiverSignature({
        bookingId,
        signatureData,
        participantIndex: index,
      });

      // Save waiver info
      const waiverResult = await saveWaiverInfo(bookingId, {
        participant_index: index,
        signer_name: state.name.trim(),
        passport_no: state.passportNo.trim(),
        date: state.date,
        email: state.email.trim(),
        signed: true,
        signature_url: sigResult.url || null,
      });

      if (waiverResult.error) throw new Error(waiverResult.error);

      updateWaiverState(index, { completed: true, signed: true });
      toast({ title: "Signed!", description: `Waiver signed for ${state.name}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save waiver", variant: "destructive" });
    } finally {
      updateWaiverState(index, { saving: false });
    }
  };

  const handleSendWaiverEmail = async (index: number) => {
    const state = waiverStates[index];
    if (!state.email.trim()) {
      toast({ title: "Email Required", description: "Please enter the participant's email to send the waiver link.", variant: "destructive" });
      return;
    }

    updateWaiverState(index, { sendingEmail: true });

    try {
      const result = await sendWaiverEmailToParticipant(
        bookingId,
        index,
        state.name || participants[index].name,
        state.email.trim()
      );

      if (result.error) throw new Error(result.error);

      updateWaiverState(index, { emailSent: true, signLater: true });
      toast({ title: "Email Sent!", description: `Waiver link sent to ${state.email}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to send email", variant: "destructive" });
    } finally {
      updateWaiverState(index, { sendingEmail: false });
    }
  };

  const handleSubmitPayment = async () => {
    if (!paymentSlip) {
      toast({ title: "Missing", description: "Please upload your payment slip.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const slipFormData = new FormData();
      slipFormData.append("file", paymentSlip);
      slipFormData.append("bookingId", bookingId);

      const result = await uploadPaymentSlip(slipFormData);
      if (result.error) throw new Error(result.error);

      setPaymentUploaded(true);
      toast({ title: "Payment Uploaded!", description: "Your payment slip has been submitted." });
      router.refresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to upload", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const allWaiversDone = waiverStates.every((s) => s.completed || s.signLater);

  return (
    <div className="space-y-6">
      {/* Cancellation Policy */}
      <Card className="border-red-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-4 w-4" />
            Cancellation Policy
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-gray-600">
          <p>• <strong>3+ days before tour date:</strong> Full refund (minus bank transfer charges & admin fee)</p>
          <p>• <strong>Less than 3 days before tour date:</strong> 25% refund for full payment only</p>
          <p>• <strong>No-show:</strong> No refund</p>
        </CardContent>
      </Card>

      {/* Payment Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Step 1: Choose Payment Option
          </CardTitle>
          <CardDescription>
            Total amount: <strong className="text-primary">{formatPrice(totalAmount)}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!paymentOption ? (
            <div className="grid gap-3">
              <button
                onClick={() => handleSelectPaymentOption('deposit_50')}
                disabled={settingOption}
                className="p-4 border-2 rounded-lg text-left hover:border-primary transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">Option 1: 50% Deposit</p>
                    <p className="text-sm text-gray-500">Pay {formatPrice(depositAmount)} now, remaining {formatPrice(remainingAmount)} before tour or at venue</p>
                  </div>
                  <Badge variant="secondary">{formatPrice(depositAmount)}</Badge>
                </div>
              </button>
              <button
                onClick={() => handleSelectPaymentOption('full_100')}
                disabled={settingOption}
                className="p-4 border-2 rounded-lg text-left hover:border-primary transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">Option 2: Full Payment (100%)</p>
                    <p className="text-sm text-gray-500">Pay the full amount now</p>
                  </div>
                  <Badge variant="secondary">{formatPrice(totalAmount)}</Badge>
                </div>
              </button>
              <button
                onClick={() => handleSelectPaymentOption('pay_at_venue')}
                disabled={settingOption}
                className="p-4 border-2 rounded-lg text-left hover:border-primary transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">Option 3: Pay at Venue</p>
                    <p className="text-sm text-gray-500">Pay the full amount on the day at check-in (cash or transfer)</p>
                  </div>
                  <Badge variant="outline">On-site</Badge>
                </div>
              </button>
              {settingOption && (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...
                </div>
              )}
            </div>
          ) : paymentOption === 'pay_at_venue' ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
                <CheckCircle2 className="h-5 w-5" />
                <div>
                  <p className="font-medium">Pay at Venue Selected</p>
                  <p className="text-sm">Please pay {formatPrice(totalAmount)} at check-in on the day of your tour.</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setPaymentOptionState(null)} className="text-xs text-gray-500">
                Change payment option
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm">
                <p className="font-semibold text-gray-800">
                  {paymentOption === 'deposit_50' ? `50% Deposit: ${formatPrice(depositAmount)}` : `Full Payment: ${formatPrice(totalAmount)}`}
                </p>
                {paymentOption === 'deposit_50' && (
                  <p className="text-gray-600 mt-1">Remaining {formatPrice(remainingAmount)} to be paid before tour or at venue on the day.</p>
                )}
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold mb-2">Bank Transfer Details</p>
                <div className="text-sm space-y-1">
                  <p><strong>Bank:</strong> {bankInfo?.bank_name || "Siam Commercial Bank (SCB)"}</p>
                  <p><strong>Account Name:</strong> {bankInfo?.bank_account_name || "Nuthawut Tharatjai"}</p>
                  <p><strong>Account Number:</strong> {bankInfo?.bank_account_number || "406-7-61675-7"}</p>
                  {(bankInfo?.bank_swift_code) && (
                    <p><strong>SWIFT Code:</strong> {bankInfo.bank_swift_code}</p>
                  )}
                  <p className="mt-2 font-semibold text-primary">
                    Transfer Amount: {formatPrice(paymentOption === 'deposit_50' ? depositAmount : totalAmount)}
                  </p>
                </div>
              </div>

              {paymentUploaded ? (
                <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Payment slip uploaded successfully!</span>
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="payment-slip">Payment Slip Image *</Label>
                    <div className="mt-2">
                      <input id="payment-slip" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                      <label
                        htmlFor="payment-slip"
                        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                          paymentSlip ? "border-primary bg-orange-50" : "border-gray-300 hover:border-primary"
                        }`}
                      >
                        {paymentSlip ? (
                          <div className="flex items-center gap-2 text-primary">
                            <Check className="h-5 w-5" />
                            <span>{paymentSlip.name}</span>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Click to upload payment slip</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                  <Button onClick={handleSubmitPayment} disabled={!paymentSlip || submitting} className="w-full">
                    {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</> : "Upload Payment Slip"}
                  </Button>
                </>
              )}

              <Button variant="ghost" size="sm" onClick={() => setPaymentOptionState(null)} className="text-xs text-gray-500">
                Change payment option
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Waiver Section Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            Step 2: Liability Waivers ({participants.length} {participants.length === 1 ? "person" : "people"})
          </CardTitle>
          <CardDescription>
            Each participant must sign their own waiver. If someone is not present, you can send them the waiver link via email to sign later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Waiver Text - shown once */}
          <div className="p-4 bg-gray-50 rounded-lg max-h-48 overflow-y-auto text-sm leading-relaxed mb-4">
            {WAIVER_TEXT.map((text, i) => (
              <p key={i} className={`mb-3 ${i === 3 ? "font-semibold" : ""}`}>{text}</p>
            ))}
          </div>

          <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-gray-800">Important: Physical Document Required</p>
              <p className="text-gray-600 mt-1">
                A printed copy of this waiver will be provided at check-in for your physical signature. Please bring a valid passport or ID for verification.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Per-Participant Waiver Cards */}
      {participants.map((participant, index) => {
        const state = waiverStates[index];

        if (state.completed) {
          return (
            <Card key={index} className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800">
                      {participant.name} {index === 0 && <Badge variant="secondary" className="ml-1">Lead</Badge>}
                    </p>
                    <p className="text-sm text-green-600">Waiver signed successfully</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        }

        if (state.signLater && state.emailSent) {
          return (
            <Card key={index} className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Mail className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-800">
                      {participant.name} {index === 0 && <Badge variant="secondary" className="ml-1">Lead</Badge>}
                    </p>
                    <p className="text-sm text-blue-600">Waiver link sent to {state.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        }

        return (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Rider {index + 1}: {participant.name}
                {index === 0 && <Badge variant="secondary">Lead Guest</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    placeholder="As shown on passport / ID"
                    value={state.name}
                    onChange={(e) => updateWaiverState(index, { name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Passport / ID Number *</Label>
                  <Input
                    placeholder="e.g., AB1234567"
                    value={state.passportNo}
                    onChange={(e) => updateWaiverState(index, { passportNo: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={state.date}
                    onChange={(e) => updateWaiverState(index, { date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    placeholder="their@email.com"
                    value={state.email}
                    onChange={(e) => updateWaiverState(index, { email: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`agree-${index}`}
                  checked={state.agreed}
                  onCheckedChange={(checked) => updateWaiverState(index, { agreed: checked as boolean })}
                />
                <label htmlFor={`agree-${index}`} className="text-sm font-medium leading-none">
                  I have read and agree to the waiver terms above
                </label>
              </div>

              <Separator />

              {/* Signature */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Signature *</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signatureRefs.current[index]?.clear()}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Clear
                  </Button>
                </div>
                <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
                  <SignatureCanvas
                    ref={(ref) => { signatureRefs.current[index] = ref; }}
                    penColor="black"
                    canvasProps={{
                      className: "w-full h-40",
                      style: { width: "100%", height: "160px" },
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => handleSignWaiver(index)}
                  disabled={state.saving}
                  className="flex-1"
                >
                  {state.saving ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                  ) : (
                    <><FileSignature className="h-4 w-4 mr-2" /> Sign Waiver</>
                  )}
                </Button>

                <div className="relative flex-1">
                  <Button
                    variant="outline"
                    onClick={() => handleSendWaiverEmail(index)}
                    disabled={state.sendingEmail || !state.email.trim()}
                    className="w-full"
                  >
                    {state.sendingEmail ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
                    ) : (
                      <><Send className="h-4 w-4 mr-2" /> Sign Later (Send Email)</>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
