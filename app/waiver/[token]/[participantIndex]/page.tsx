import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Booking } from "@/lib/types";
import IndividualWaiverForm from "./individual-waiver-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sign Liability Waiver",
  robots: { index: false, follow: false },
};

async function getBooking(token: string): Promise<Booking | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, route:routes(*)")
    .eq("tracking_token", token)
    .single();

  if (error) return null;
  return data;
}

export default async function IndividualWaiverPage({
  params,
}: {
  params: { token: string; participantIndex: string };
}) {
  const booking = await getBooking(params.token);
  const pIndex = parseInt(params.participantIndex);

  if (!booking || isNaN(pIndex) || pIndex < 0 || pIndex >= booking.participants_info.length) {
    notFound();
  }

  const participant = booking.participants_info[pIndex];
  const existingWaiver = booking.waiver_info?.find((w) => w.participant_index === pIndex);

  if (existingWaiver?.signed) {
    return (
      <div className="bg-white min-h-screen">
        <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
          <div className="bg-green-50 border border-green-200 rounded-xl p-8">
            <h1 className="text-2xl font-bold text-green-800 mb-2">Waiver Already Signed</h1>
            <p className="text-green-600">
              The waiver for <strong>{participant.name}</strong> has already been signed. Thank you!
            </p>
            <p className="text-sm text-gray-500 mt-4">
              A printed copy will be provided at check-in. Please bring a valid passport or ID.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Liability Waiver</h1>
          <p className="text-gray-500 mt-1">
            {booking.route?.title} — Rider: <strong>{participant.name}</strong>
          </p>
        </div>

        <IndividualWaiverForm
          bookingId={booking.id}
          participantIndex={pIndex}
          participantName={participant.name}
        />
      </div>
    </div>
  );
}
