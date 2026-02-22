import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { Booking, WaiverInfo } from "@/lib/types";
import PrintButton from "./print-button";

export const dynamic = "force-dynamic";

function extractStoragePath(url: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.substring(idx + marker.length);
}

async function getBooking(id: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, route:routes(*)")
    .eq("id", id)
    .single();

  if (error) return null;

  // Generate signed URL for booking-level waiver signature (fallback)
  let bookingSignatureUrl: string | null = null;
  if (data.waiver_signature_url) {
    const path = extractStoragePath(data.waiver_signature_url, "waiver-signatures");
    if (path) {
      const { data: signed } = await supabase.storage
        .from("waiver-signatures")
        .createSignedUrl(path, 3600);
      bookingSignatureUrl = signed?.signedUrl || null;
    }
  }

  // Generate signed URLs for per-participant waiver signatures
  if (Array.isArray(data.waiver_info)) {
    for (const w of data.waiver_info) {
      if (w.signature_url) {
        const sigPath = extractStoragePath(w.signature_url, "waiver-signatures");
        if (sigPath) {
          const { data: signed } = await supabase.storage
            .from("waiver-signatures")
            .createSignedUrl(sigPath, 3600);
          w.signature_url = signed?.signedUrl || w.signature_url;
        }
      }
    }
  }

  return { ...data, bookingSignatureUrl } as Booking & { bookingSignatureUrl: string | null };
}

const WAIVER_PARAGRAPHS = [
  "I the undersigned, accept full responsibility for the rented MTB Bike while in my possession. I also agree to reimburse Mad Monkey Chiangmai for any theft, loss or damages, other than reasonable wear and tear resulting from normal use.",
  "I verify that I am familiar with the proper use of the bicycle listed on this form including use of brakes, gear shifting, and dropper seat post. I have inspected same, and it is in good conditions and working order.",
  "I understand that mountain biking is a Hazardous Activity. Further, I recognise that there are risks, inherent and others, including but not limited to, steep and narrow trails, roads, man made obstacles, jumps and other features, natural variations in terrain, bumps, stumps, ruts, forrest growth, debris, rock and other hazards and obstacles including vehicles and other users and varying weather conditions. I further realise that falls and collisions which may cause injuries or death can occur. I agree to Assume All Risk And Responsibility for myself for such incidents and injuries.",
  "I AGREE TO RELEASE FROM ANY LEGAL LIABILITY, IDEMNIFY, DEFEND HOLD HARMLESS AND NEVER SUE MAD MONKEY CHIANG MAI special events organisers, sponsors and all of their directors, officers, partners, investors, shareholders, members, agent, employees, and affiliated company for any injury or damage to person or property, including negligence.",
  "I understand that Helmets are required and I agree to wear my helmet at all times. I understand that while helmet is a necessary equipment to help protect against injuries, it does not guarantee the elimination of risk on injury or death.",
  "I agree to remain on guided trails at all times. I understand that if I become lost, I maybe held responsible for cost of search and rescue. I also understand that if I ride on public road, I am responsible for following all traffic laws and rules.",
  "I confirmed that I have read and understood this agreement and understand that this is a contract that limits my legal rights and that it is binding upon me, my heirs and legal representative. I understand that this agreement is based on the interpreted under the Thailand Law. If any clause is found to be invalid the balance of the contract will remain in effect and will be valid and enforceable.",
];

function WaiverDocument({
  participant,
  waiver,
  booking,
  index,
  fallbackSignatureUrl,
}: {
  participant: { name: string };
  waiver: WaiverInfo | undefined;
  booking: Booking;
  index: number;
  fallbackSignatureUrl?: string | null;
}) {
  const signatureUrl = waiver?.signature_url || fallbackSignatureUrl;

  return (
    <div className="w-full p-8 print:p-0 print:break-after-page">
      <h1 className="text-center font-bold text-lg mb-5 leading-tight">
        MAD MONKEY CHIANGMAI MTB ADVENTURE TOUR AND RENTAL RELEASE OF LIABILITY
        AND MTB BIKE RENTAL AGREEMENT
      </h1>

      <div className="text-[15px] leading-normal space-y-3">
        {WAIVER_PARAGRAPHS.map((text, i) => (
          <p key={i} className={i === 3 ? "font-bold" : ""}>{text}</p>
        ))}
      </div>

      <div className="mt-8 space-y-4 text-[15px]">
        <div className="flex items-end gap-2">
          <span className="font-semibold w-32 shrink-0">Signed</span>
          <span className="mr-2">:</span>
          <span className="flex-1 border-b border-dotted border-gray-400 pb-1 min-h-[24px]">
            {signatureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={signatureUrl}
                alt={`Signature of ${waiver?.signer_name || participant.name}`}
                className="h-14 object-contain"
              />
            ) : null}
          </span>
        </div>
        <div className="flex items-end gap-2">
          <span className="font-semibold w-32 shrink-0">Name.</span>
          <span className="mr-2">:</span>
          <span className="flex-1 border-b border-dotted border-gray-400 pb-1">
            {waiver?.signer_name || participant.name}
          </span>
        </div>
        <div className="flex items-end gap-2">
          <span className="font-semibold w-32 shrink-0">Passport No.</span>
          <span className="mr-2">:</span>
          <span className="flex-1 border-b border-dotted border-gray-400 pb-1">
            {waiver?.passport_no || ""}
          </span>
        </div>
        <div className="flex items-end gap-2">
          <span className="font-semibold w-32 shrink-0">Date</span>
          <span className="mr-2">:</span>
          <span className="flex-1 border-b border-dotted border-gray-400 pb-1">
            {waiver?.date ? formatDate(waiver.date) : formatDate(booking.tour_date)}
          </span>
        </div>
        <div className="flex items-end gap-2">
          <span className="font-semibold w-32 shrink-0">Email.</span>
          <span className="mr-2">:</span>
          <span className="flex-1 border-b border-dotted border-gray-400 pb-1">
            {waiver?.email || ""}
          </span>
        </div>
      </div>

      <div className="mt-8 pt-3 border-t border-gray-300 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>Tour: {booking.route?.title}</span>
          <span>Rider {index + 1}: {participant.name}</span>
          <span>Date: {formatDate(booking.tour_date)}</span>
        </div>
      </div>
    </div>
  );
}

export default async function WaiverPrintPage({
  params,
}: {
  params: { id: string };
}) {
  const booking = await getBooking(params.id);

  if (!booking) {
    notFound();
  }

  const waivers = booking.waiver_info || [];

  return (
    <div className="bg-white min-h-screen">
      {/* Print Controls */}
      <div className="print:hidden p-4 bg-gray-100 border-b flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Waiver Documents ({booking.participants_info.length} riders)</h2>
          <p className="text-sm text-gray-500">
            {booking.customer_name} — {booking.route?.title} — {formatDate(booking.tour_date)}
          </p>
        </div>
        <PrintButton />
      </div>

      {/* Waiver Status Summary */}
      <div className="print:hidden max-w-[210mm] mx-auto px-8 pt-6">
        <div className="grid gap-2">
          {booking.participants_info.map((p, i) => {
            const w = waivers.find((w: WaiverInfo) => w.participant_index === i);
            return (
              <div key={i} className={`flex items-center justify-between p-3 rounded-lg text-sm ${w?.signed ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"}`}>
                <span>
                  <strong>Rider {i + 1}:</strong> {p.name}
                  {w?.signed && <span className="text-green-600 ml-2">✓ Signed</span>}
                  {!w?.signed && <span className="text-yellow-600 ml-2">⏳ Not signed</span>}
                </span>
                {w?.passport_no && <span className="text-gray-500">Passport: {w.passport_no}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* One A4 page per participant */}
      {booking.participants_info.map((participant, index) => {
        const waiver = waivers.find((w: WaiverInfo) => w.participant_index === index);
        return (
          <WaiverDocument
            key={index}
            participant={participant}
            waiver={waiver}
            booking={booking}
            index={index}
            fallbackSignatureUrl={booking.bookingSignatureUrl}
          />
        );
      })}
    </div>
  );
}
