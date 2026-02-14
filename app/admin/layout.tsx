import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { LayoutDashboard, Route, CalendarDays, Users, Settings, QrCode, Contact } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import SessionTimeout from "./session-timeout";
import AdminSidebarFooter from "./admin-sidebar-footer";

async function getApprovedAdmin() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("is_approved")
    .eq("auth_id", user.id)
    .single();

  if (!adminUser?.is_approved) return null;
  return user;
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getApprovedAdmin();

  // No approved admin user — render page without sidebar (login, reset-password, etc.)
  if (!user) {
    return <>{children}</>;
  }

  // Approved admin — render full dashboard layout with sidebar + session timeout
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <SessionTimeout />
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-60 bg-white dark:bg-card border-r border-gray-200 dark:border-border">
        <div className="p-5 border-b border-gray-200 dark:border-border">
          <Link href="/admin" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Mad Monkey eBike Tours"
              width={40}
              height={40}
              className="h-8 w-8 object-contain"
            />
            <span className="font-semibold text-sm text-gray-800 dark:text-foreground">Admin</span>
          </Link>
        </div>

        <nav className="px-3 py-4 space-y-1">
          <Link href="/admin">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-orange-50 dark:hover:bg-accent font-medium"
            >
              <LayoutDashboard className="h-4 w-4 mr-3" />
              Dashboard
            </Button>
          </Link>
          <Link href="/admin/bookings">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-orange-50 dark:hover:bg-accent font-medium"
            >
              <CalendarDays className="h-4 w-4 mr-3" />
              Bookings
            </Button>
          </Link>
          <Link href="/admin/check-in">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-orange-50 dark:hover:bg-accent font-medium"
            >
              <QrCode className="h-4 w-4 mr-3" />
              Check-In
            </Button>
          </Link>
          <Link href="/admin/customers">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-orange-50 dark:hover:bg-accent font-medium"
            >
              <Contact className="h-4 w-4 mr-3" />
              Customers
            </Button>
          </Link>
          <Link href="/admin/routes">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-orange-50 dark:hover:bg-accent font-medium"
            >
              <Route className="h-4 w-4 mr-3" />
              Routes
            </Button>
          </Link>
          <Link href="/admin/users">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-orange-50 dark:hover:bg-accent font-medium"
            >
              <Users className="h-4 w-4 mr-3" />
              Users
            </Button>
          </Link>
          <Link href="/admin/settings">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-orange-50 dark:hover:bg-accent font-medium"
            >
              <Settings className="h-4 w-4 mr-3" />
              Email Settings
            </Button>
          </Link>
        </nav>

        <AdminSidebarFooter />
      </aside>

      {/* Main Content */}
      <main className="ml-60 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
