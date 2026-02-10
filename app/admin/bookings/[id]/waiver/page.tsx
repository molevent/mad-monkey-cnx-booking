import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { Booking, WaiverInfo } from "@/lib/types";
import PrintButton from "./print-button";

export const dynamic = "force-dynamic";

async function getBooking(id: string): Promise<Booking | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, route:routes(*)")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
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
}: {
  participant: { name: string };
  waiver: WaiverInfo | undefined;
  booking: Booking;
  index: number;
}) {
  return (
    <div className="max-w-[210mm] mx-auto p-8 print:p-[15mm] print:max-w-none print:break-after-page">
      <h1 className="text-center font-bold text-lg mb-6 leading-tight">
        MAD MONKEY CHIANGMAI MTB ADVENTURE TOUR AND RENTAL RELEASE OF LIABILITY
        AND MTB BIKE RENTAL AGREEMENT
      </h1>

      <div className="text-sm leading-relaxed space-y-4">
        {WAIVER_PARAGRAPHS.map((text, i) => (
          <p key={i} className={i === 3 ? "font-bold" : ""}>{text}</p>
        ))}
      </div>

      <div className="mt-10 space-y-6 text-sm">
        <div className="flex items-end gap-2">
          <span className="font-semibold w-32 shrink-0">Signed</span>
          <span className="mr-2">:</span>
          <span className="flex-1 border-b border-dotted border-gray-400 pb-1 min-h-[24px]">&nbsp;</span>
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

      <div className="mt-12 pt-4 border-t border-gray-300 text-xs text-gray-500">
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
          />
        );
      })}
    </div>
  );
}
