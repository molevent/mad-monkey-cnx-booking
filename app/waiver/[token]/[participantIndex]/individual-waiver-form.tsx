"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import SignatureCanvas from "react-signature-canvas";
import { FileSignature, Loader2, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { uploadWaiverSignature } from "@/app/actions/uploads";
import { saveWaiverInfo } from "@/app/actions/bookings";

const WAIVER_TEXT = [
  "I the undersigned, accept full responsibility for the rented MTB Bike while in my possession. I also agree to reimburse Mad Monkey Chiangmai for any theft, loss or damages, other than reasonable wear and tear resulting from normal use.",
  "I verify that I am familiar with the proper use of the bicycle listed on this form including use of brakes, gear shifting, and dropper seat post. I have inspected same, and it is in good conditions and working order.",
  "I understand that mountain biking is a Hazardous Activity. Further, I recognise that there are risks, inherent and others, including but not limited to, steep and narrow trails, roads, man made obstacles, jumps and other features, natural variations in terrain, bumps, stumps, ruts, forrest growth, debris, rock and other hazards and obstacles including vehicles and other users and varying weather conditions. I further realise that falls and collisions which may cause injuries or death can occur. I agree to Assume All Risk And Responsibility for myself for such incidents and injuries.",
  "I AGREE TO RELEASE FROM ANY LEGAL LIABILITY, IDEMNIFY, DEFEND HOLD HARMLESS AND NEVER SUE MAD MONKEY CHIANG MAI special events organisers, sponsors and all of their directors, officers, partners, investors, shareholders, members, agent, employees, and affiliated company for any injury or damage to person or property, including negligence.",
  "I understand that Helmets are required and I agree to wear my helmet at all times. I understand that while helmet is a necessary equipment to help protect against injuries, it does not guarantee the elimination of risk on injury or death.",
  "I agree to remain on guided trails at all times. I understand that if I become lost, I maybe held responsible for cost of search and rescue. I also understand that if I ride on public road, I am responsible for following all traffic laws and rules.",
  "I confirmed that I have read and understood this agreement and understand that this is a contract that limits my legal rights and that it is binding upon me, my heirs and legal representative. I understand that this agreement is based on the interpreted under the Thailand Law. If any clause is found to be invalid the balance of the contract will remain in effect and will be valid and enforceable.",
];

interface Props {
  bookingId: string;
  participantIndex: number;
  participantName: string;
}

export default function IndividualWaiverForm({ bookingId, participantIndex, participantName }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const signatureRef = useRef<SignatureCanvas>(null);

  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const [name, setName] = useState(participantName || "");
  const [passportNo, setPassportNo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [email, setEmail] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({ title: "Required", description: "Please enter your full name.", variant: "destructive" });
      return;
    }
    if (!passportNo.trim()) {
      toast({ title: "Required", description: "Please enter your Passport / ID number.", variant: "destructive" });
      return;
    }
    if (!email.trim()) {
      toast({ title: "Required", description: "Please enter your email.", variant: "destructive" });
      return;
    }
    if (!agreed) {
      toast({ title: "Required", description: "Please agree to the waiver terms.", variant: "destructive" });
      return;
    }
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast({ title: "Required", description: "Please sign the waiver.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const signatureData = signatureRef.current.toDataURL("image/png");
      const sigResult = await uploadWaiverSignature({
        bookingId,
        signatureData,
        participantIndex,
      });

      const waiverResult = await saveWaiverInfo(bookingId, {
        participant_index: participantIndex,
        signer_name: name.trim(),
        passport_no: passportNo.trim(),
        date,
        email: email.trim(),
        signed: true,
        signature_url: sigResult.url || null,
      });

      if (waiverResult.error) throw new Error(waiverResult.error);

      setCompleted(true);
      toast({ title: "Waiver Signed!", description: "Thank you for signing the waiver." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save waiver", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (completed) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-8 pb-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-green-800 mb-2">Waiver Signed Successfully!</h2>
          <p className="text-green-600">
            Thank you, <strong>{name}</strong>. Your waiver has been recorded.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            A printed copy will be provided at check-in. Please bring a valid passport or ID for verification.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            Liability Waiver & Rental Agreement
          </CardTitle>
          <CardDescription>
            MAD MONKEY CHIANGMAI MTB ADVENTURE TOUR AND RENTAL RELEASE OF LIABILITY AND MTB BIKE RENTAL AGREEMENT
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg max-h-56 overflow-y-auto text-sm leading-relaxed">
            {WAIVER_TEXT.map((text, i) => (
              <p key={i} className={`mb-3 ${i === 3 ? "font-semibold" : ""}`}>{text}</p>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="agree-terms"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked as boolean)}
            />
            <label htmlFor="agree-terms" className="text-sm font-medium leading-none">
              I have read and agree to the terms above
            </label>
          </div>

          <Separator />

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                placeholder="As shown on passport / ID"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Passport / ID Number *</Label>
              <Input
                placeholder="e.g., AB1234567"
                value={passportNo}
                onChange={(e) => setPassportNo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Your Signature *</Label>
              <Button variant="ghost" size="sm" onClick={() => signatureRef.current?.clear()}>
                <Trash2 className="h-4 w-4 mr-1" /> Clear
              </Button>
            </div>
            <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
              <SignatureCanvas
                ref={signatureRef}
                penColor="black"
                canvasProps={{
                  className: "w-full h-40",
                  style: { width: "100%", height: "160px" },
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Sign in the box above using your mouse or finger
            </p>
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

      <Button
        size="lg"
        className="w-full"
        disabled={saving}
        onClick={handleSubmit}
      >
        {saving ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing...</>
        ) : (
          <><FileSignature className="h-4 w-4 mr-2" /> Sign Waiver</>
        )}
      </Button>
    </div>
  );
}
