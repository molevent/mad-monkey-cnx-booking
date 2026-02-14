import Link from "next/link";
import { CalendarDays, Route, Users, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import type { Booking } from "@/lib/types";

async function getStats() {
  const supabase = createServerSupabaseClient();
  
  const { count: totalBookings } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true });

  const { count: pendingBookings } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("status", "PENDING_REVIEW");

  const { count: confirmedBookings } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("status", "CONFIRMED");

  const { count: totalRoutes } = await supabase
    .from("routes")
    .select("*", { count: "exact", head: true });

  return {
    totalBookings: totalBookings || 0,
    pendingBookings: pendingBookings || 0,
    confirmedBookings: confirmedBookings || 0,
    totalRoutes: totalRoutes || 0,
  };
}

async function getRecentBookings(): Promise<Booking[]> {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("bookings")
    .select("*, route:routes(title)")
    .order("created_at", { ascending: false })
    .limit(5);

  return data || [];
}

export default async function AdminDashboard() {
  const stats = await getStats();
  const recentBookings = await getRecentBookings();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-3">
          <Link href="/admin/routes">
            <Button>
              <Route className="h-4 w-4 mr-2" />
              Manage Routes
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-white dark:bg-card border border-gray-200 dark:border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase tracking-wide">
              Total Bookings
            </CardTitle>
            <div className="p-2 bg-orange-50 rounded-lg">
              <CalendarDays className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalBookings}</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card border border-gray-200 dark:border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase tracking-wide">
              Pending Review
            </CardTitle>
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">
              {stats.pendingBookings}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card border border-gray-200 dark:border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase tracking-wide">
              Confirmed
            </CardTitle>
            <div className="p-2 bg-orange-50 rounded-lg">
              <CheckCircle className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {stats.confirmedBookings}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card border border-gray-200 dark:border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase tracking-wide">
              Active Routes
            </CardTitle>
            <div className="p-2 bg-gray-100 dark:bg-secondary rounded-lg">
              <Route className="h-4 w-4 text-gray-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalRoutes}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Bookings</CardTitle>
          <Link href="/admin/bookings">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <p className="text-gray-500 dark:text-muted-foreground text-center py-8">No bookings yet</p>
          ) : (
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 bg-white dark:bg-card border border-gray-100 dark:border-border rounded-lg hover:border-orange-200 dark:hover:border-primary/30 transition-colors"
                >
                  <div>
                    <p className="font-semibold">{booking.customer_name}</p>
                    <p className="text-sm text-gray-500 dark:text-muted-foreground">
                      {booking.route?.title} • {formatDate(booking.tour_date)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-muted-foreground">
                      {booking.pax_count} rider(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(booking.status)}>
                      {getStatusLabel(booking.status)}
                    </Badge>
                    <Link href={`/admin/bookings/${booking.id}`}>
                      <Button variant="ghost" size="sm" className="mt-2">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
