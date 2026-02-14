import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, Globe, CreditCard, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatPrice, getStatusColor, getStatusLabel } from "@/lib/utils";
import type { Customer, Booking } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getCustomer(id: string) {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();
  return data as Customer | null;
}

async function getCustomerBookings(customerId: string) {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("bookings")
    .select("*, route:routes(title, slug, price)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  return (data as Booking[]) || [];
}

async function getBookingsByEmail(email: string) {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("bookings")
    .select("*, route:routes(title, slug, price)")
    .eq("customer_email", email)
    .order("created_at", { ascending: false });
  return (data as Booking[]) || [];
}

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const customer = await getCustomer(params.id);
  if (!customer) notFound();

  // Get bookings by customer_id first, fallback to email match
  let bookings = await getCustomerBookings(customer.id);
  if (bookings.length === 0) {
    bookings = await getBookingsByEmail(customer.email);
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/customers">
          <Button variant="ghost" size="sm" className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Customers
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{customer.full_name}</h1>
        <p className="text-sm text-gray-500">Customer since {new Date(customer.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Customer Info */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <a href={`mailto:${customer.email}`} className="text-primary hover:underline">
                  {customer.email}
                </a>
              </div>
              {customer.whatsapp && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{customer.whatsapp}</span>
                </div>
              )}
              {customer.passport_no && (
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <span>{customer.passport_no}</span>
                </div>
              )}
              {customer.nationality && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <span>{customer.nationality}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Bookings</span>
                <span className="font-semibold">{bookings.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Confirmed</span>
                <span className="font-semibold text-green-600">
                  {bookings.filter((b) => b.status === "CONFIRMED").length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Cancelled</span>
                <span className="font-semibold text-red-600">
                  {bookings.filter((b) => b.status === "CANCELLED").length}
                </span>
              </div>
              {customer.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Notes</p>
                    <p className="text-sm text-gray-700">{customer.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Booking History */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Booking History</CardTitle>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No bookings found.</p>
              ) : (
                <div className="space-y-3">
                  {bookings.map((booking) => (
                    <Link
                      key={booking.id}
                      href={`/admin/bookings/${booking.id}`}
                      className="block p-4 rounded-lg border border-gray-200 hover:border-primary/30 hover:bg-orange-50/30 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {(booking.route as any)?.title || "Unknown Route"}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(booking.tour_date)}
                            </span>
                            <span>{booking.pax_count} pax</span>
                          </div>
                        </div>
                        <Badge className={getStatusColor(booking.status)}>
                          {getStatusLabel(booking.status)}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
