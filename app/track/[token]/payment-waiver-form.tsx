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
import { useI18n } from "@/lib/i18n/context";
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
  tourDate: string;
  section?: "payment" | "waivers";
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

export default function PaymentWaiverForm({ bookingId, trackingToken, participants, existingWaivers, totalAmount, existingPaymentOption, tourDate, section = "payment", bankInfo }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();
  const signatureRefs = useRef<(SignatureCanvas | null)[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [paymentSlip, setPaymentSlip] = useState<File | null>(null);
  const [paymentUploaded, setPaymentUploaded] = useState(false);
  const [paymentOption, setPaymentOptionState] = useState<string | null>(existingPaymentOption);
  const [settingOption, setSettingOption] = useState(false);

  const depositAmount = Math.ceil(totalAmount * 0.5);
  const remainingAmount = totalAmount - depositAmount;

  // If tour date is within 24 hours or already passed, only allow full payment
  const now = new Date();
  const tourDateTime = new Date(tourDate + 'T00:00:00');
  const hoursUntilTour = (tourDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  const isWithin24Hours = hoursUntilTour <= 24;

  const handleSelectPaymentOption = async (option: 'deposit_50' | 'full_100') => {
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
        toast({ title: t("common.error"), description: t("waiver.file_too_large"), variant: "destructive" });
        return;
      }
      setPaymentSlip(file);
    }
  };

  const handleSignWaiver = async (index: number) => {
    const state = waiverStates[index];
    if (!state.name.trim() || !state.passportNo.trim() || !state.email.trim()) {
      toast({ title: t("common.error"), description: t("waiver.missing_info"), variant: "destructive" });
      return;
    }
    if (!state.agreed) {
      toast({ title: t("common.error"), description: t("waiver.agree_required"), variant: "destructive" });
      return;
    }

    const sigCanvas = signatureRefs.current[index];
    if (!sigCanvas || sigCanvas.isEmpty()) {
      toast({ title: t("common.error"), description: t("waiver.sig_required"), variant: "destructive" });
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
      toast({ title: t("common.error"), description: t("waiver.email_required"), variant: "destructive" });
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
      toast({ title: t("common.error"), description: t("waiver.missing_slip"), variant: "destructive" });
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
  const paymentDone = paymentUploaded || !!existingPaymentOption;

  const showPayment = section === "payment";
  const showWaivers = section === "waivers";

  return (
    <div className="space-y-6">
      {/* ===== PAYMENT SECTION ===== */}
      {showPayment && (<>
      {/* Cancellation Policy */}
      <Card className="border-red-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-4 w-4" />
            {t("pay.cancellation_policy")}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-gray-600">
          <p>• {t("pay.cancel_3days")}</p>
          <p>• {t("pay.cancel_less3")}</p>
          <p>• {t("pay.cancel_noshow")}</p>
        </CardContent>
      </Card>

      {/* Payment Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            {t("pay.choose_option")}
          </CardTitle>
          <CardDescription>
            {t("pay.total_amount")}: <strong className="text-primary">{formatPrice(totalAmount)}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!paymentOption ? (
            <div className="grid gap-3">
              <button
                onClick={() => !isWithin24Hours && handleSelectPaymentOption('deposit_50')}
                disabled={settingOption || isWithin24Hours}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  isWithin24Hours
                    ? "opacity-50 cursor-not-allowed bg-gray-50 border-gray-200"
                    : "hover:border-primary"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className={`font-semibold ${isWithin24Hours ? "text-gray-400" : ""}`}>{t("pay.option1_title")}</p>
                    <p className={`text-sm ${isWithin24Hours ? "text-gray-400" : "text-gray-500"}`}>{t("pay.option1_desc").replace("{{amount}}", formatPrice(depositAmount)).replace("{{remaining}}", formatPrice(remainingAmount))}</p>
                    {isWithin24Hours && (
                      <p className="text-xs text-red-500 mt-1 font-medium">{t("pay.deposit_unavailable")}</p>
                    )}
                  </div>
                  <Badge variant="secondary" className={isWithin24Hours ? "opacity-50" : ""}>{formatPrice(depositAmount)}</Badge>
                </div>
              </button>
              <button
                onClick={() => handleSelectPaymentOption('full_100')}
                disabled={settingOption}
                className="p-4 border-2 rounded-lg text-left hover:border-primary transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{t("pay.option2_title")}</p>
                    <p className="text-sm text-gray-500">{t("pay.option2_desc")}</p>
                  </div>
                  <Badge variant="secondary">{formatPrice(totalAmount)}</Badge>
                </div>
              </button>
              {settingOption && (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> {t("pay.saving")}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm">
                <p className="font-semibold text-gray-800">
                  {paymentOption === 'deposit_50' ? `${t("pay.deposit_selected")}: ${formatPrice(depositAmount)}` : `${t("pay.full_selected")}: ${formatPrice(totalAmount)}`}
                </p>
                {paymentOption === 'deposit_50' && (
                  <p className="text-gray-600 mt-1">{t("pay.remaining_note").replace("{{amount}}", formatPrice(remainingAmount))}</p>
                )}
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold mb-2">{t("pay.bank_details")}</p>
                <div className="text-sm space-y-1">
                  <p><strong>{t("pay.bank")}:</strong> {bankInfo?.bank_name || "Siam Commercial Bank (SCB)"}</p>
                  <p><strong>{t("pay.account_name")}:</strong> {bankInfo?.bank_account_name || "Mr. Nuthawut Tharatjai"}</p>
                  <p><strong>{t("pay.account_number")}:</strong> {bankInfo?.bank_account_number || "406-7-61675-7"}</p>
                  <p><strong>{t("pay.swift_code")}:</strong> {bankInfo?.bank_swift_code || "SICOQHBK"}</p>
                  <p className="mt-2 font-semibold text-primary">
                    {t("pay.transfer_amount")}: {formatPrice(paymentOption === 'deposit_50' ? depositAmount : totalAmount)}
                  </p>
                </div>
              </div>

              {paymentUploaded ? (
                <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">{t("pay.slip_uploaded")}</span>
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="payment-slip">{t("pay.slip_label")} *</Label>
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
                            <p className="text-sm text-gray-500">{t("pay.click_upload")}</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                  <Button onClick={handleSubmitPayment} disabled={!paymentSlip || submitting} className="w-full">
                    {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t("pay.uploading")}</> : t("pay.upload_slip")}
                  </Button>
                </>
              )}

              <Button variant="ghost" size="sm" onClick={() => setPaymentOptionState(null)} className="text-xs text-gray-500">
                {t("pay.change_option")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      </>)}

      {/* ===== WAIVERS SECTION ===== */}
      {showWaivers && (<>
      {/* Waiver Section Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            {t("waiver.title")} ({participants.length} {participants.length === 1 ? t("waiver.person") : t("waiver.people")})
          </CardTitle>
          <CardDescription>
            {t("waiver.desc")}
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
              <p className="font-semibold text-gray-800">{t("waiver.physical_title")}</p>
              <p className="text-gray-600 mt-1">
                {t("waiver.physical_desc")}
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
                      {participant.name} {index === 0 && <Badge variant="secondary" className="ml-1">{t("waiver.lead")}</Badge>}
                    </p>
                    <p className="text-sm text-green-600">{t("waiver.signed")}</p>
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
                      {participant.name} {index === 0 && <Badge variant="secondary" className="ml-1">{t("waiver.lead")}</Badge>}
                    </p>
                    <p className="text-sm text-blue-600">{t("waiver.email_sent")} {state.email}</p>
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
                {t("booking.rider")} {index + 1}: {participant.name}
                {index === 0 && <Badge variant="secondary">{t("waiver.lead_guest")}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("waiver.full_name")} *</Label>
                  <Input
                    placeholder={t("waiver.name_placeholder")}
                    value={state.name}
                    onChange={(e) => updateWaiverState(index, { name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("waiver.passport")} *</Label>
                  <Input
                    placeholder={t("waiver.passport_placeholder")}
                    value={state.passportNo}
                    onChange={(e) => updateWaiverState(index, { passportNo: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("waiver.date")} *</Label>
                  <Input
                    type="date"
                    value={state.date}
                    onChange={(e) => updateWaiverState(index, { date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("waiver.email")} *</Label>
                  <Input
                    type="email"
                    placeholder={t("waiver.email_placeholder")}
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
                  {t("waiver.agree")}
                </label>
              </div>

              <Separator />

              {/* Signature */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>{t("waiver.signature")} *</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signatureRefs.current[index]?.clear()}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> {t("waiver.clear")}
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
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t("waiver.saving")}</>
                  ) : (
                    <><FileSignature className="h-4 w-4 mr-2" /> {t("waiver.sign")}</>
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
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t("waiver.sending")}</>
                    ) : (
                      <><Send className="h-4 w-4 mr-2" /> {t("waiver.sign_later")}</>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      </>)}
    </div>
  );
}
