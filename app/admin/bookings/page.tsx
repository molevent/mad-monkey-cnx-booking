import Link from "next/link";
import { CalendarDays, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDate, formatTime, getStatusColor, getStatusLabel } from "@/lib/utils";
import type { Booking, BookingStatus } from "@/lib/types";

async function getBookings(status?: BookingStatus): Promise<Booking[]> {
  const supabase = createServerSupabaseClient();
  
  let query = supabase
    .from("bookings")
    .select("*, route:routes(title, price)")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data } = await query;
  return data || [];
}

export default async function BookingsPage() {
  const allBookings = await getBookings();
  const pendingBookings = allBookings.filter(b => b.status === "PENDING_REVIEW");
  const awaitingPayment = allBookings.filter(b => b.status === "AWAITING_PAYMENT");
  const paymentUploaded = allBookings.filter(b => b.status === "PAYMENT_UPLOADED");
  const confirmed = allBookings.filter(b => b.status === "CONFIRMED");

  const renderBookingsTable = (bookings: Booking[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer</TableHead>
          <TableHead>Tour</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Riders</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Payment</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8 text-gray-500 dark:text-muted-foreground">
              No bookings in this category
            </TableCell>
          </TableRow>
        ) : (
          bookings.map((booking) => (
            <TableRow key={booking.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{booking.customer_name}</p>
                  <p className="text-sm text-gray-500 dark:text-muted-foreground">{booking.customer_email}</p>
                </div>
              </TableCell>
              <TableCell>{booking.route?.title}</TableCell>
              <TableCell>
                <div>
                  <p>{formatDate(booking.tour_date)}</p>
                  <p className="text-sm text-gray-500 dark:text-muted-foreground">{formatTime(booking.start_time)}</p>
                </div>
              </TableCell>
              <TableCell>{booking.pax_count}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(booking.status)}>
                  {getStatusLabel(booking.status)}
                </Badge>
              </TableCell>
              <TableCell>
                {booking.payment_status === 'fully_paid' ? (
                  <Badge className="bg-green-100 text-green-800 text-xs">ชำระครบแล้ว</Badge>
                ) : booking.payment_status === 'deposit_paid' ? (
                  <Badge className="bg-yellow-100 text-yellow-800 text-xs">มัดจำแล้ว</Badge>
                ) : booking.payment_option === 'pay_at_venue' ? (
                  <Badge className="bg-blue-100 text-blue-800 text-xs">ชำระหน้างาน</Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-600 text-xs">ยังไม่ชำระ</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Link href={`/admin/bookings/${booking.id}`}>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Bookings</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="all">
            <TabsList className="mb-6">
              <TabsTrigger value="all">
                All ({allBookings.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({pendingBookings.length})
              </TabsTrigger>
              <TabsTrigger value="awaiting">
                Awaiting Payment ({awaitingPayment.length})
              </TabsTrigger>
              <TabsTrigger value="uploaded">
                Payment Uploaded ({paymentUploaded.length})
              </TabsTrigger>
              <TabsTrigger value="confirmed">
                Confirmed ({confirmed.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {renderBookingsTable(allBookings)}
            </TabsContent>
            <TabsContent value="pending">
              {renderBookingsTable(pendingBookings)}
            </TabsContent>
            <TabsContent value="awaiting">
              {renderBookingsTable(awaitingPayment)}
            </TabsContent>
            <TabsContent value="uploaded">
              {renderBookingsTable(paymentUploaded)}
            </TabsContent>
            <TabsContent value="confirmed">
              {renderBookingsTable(confirmed)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
