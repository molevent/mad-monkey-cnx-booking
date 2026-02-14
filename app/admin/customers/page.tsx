import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Contact, Mail, Phone, Calendar, Search } from "lucide-react";
import Link from "next/link";
import type { Customer } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getCustomers() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("last_booking_at", { ascending: false, nullsFirst: false });
  return (data as Customer[]) || [];
}

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">
            {customers.length} customer{customers.length !== 1 ? "s" : ""} total
          </p>
        </div>
      </div>

      {customers.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Contact className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No customers yet</h3>
            <p className="text-sm text-gray-500">
              Customers will appear here once they make their first booking.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Passport</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Nationality</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Bookings</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Last Booking</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{customer.full_name}</div>
                    <div className="text-xs text-gray-500">{customer.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    {customer.whatsapp ? (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Phone className="h-3 w-3" />
                        {customer.whatsapp}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {customer.passport_no || <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {customer.nationality || <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="secondary" className="font-mono">
                      {customer.total_bookings}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {customer.last_booking_at
                      ? new Date(customer.last_booking_at).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
