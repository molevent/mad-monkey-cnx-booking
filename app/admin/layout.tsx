import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LayoutDashboard, Route, CalendarDays, Users, Settings, LogOut, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
  // Skip sidebar for login and reset-password pages
  const headersList = headers();
  const url = headersList.get("x-next-url") || headersList.get("x-invoke-path") || "";
  const pathname = headersList.get("x-pathname") || url;

  // Always render children-only for public admin pages
  if (pathname.includes("/admin/login") || pathname.includes("/admin/reset-password")) {
    return <>{children}</>;
  }

  const user = await getApprovedAdmin();

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-60 bg-white border-r border-gray-200">
        <div className="p-5 border-b border-gray-200">
          <Link href="/admin" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Mad Monkey eBike Tours"
              width={40}
              height={40}
              className="h-8 w-8 object-contain"
            />
            <span className="font-semibold text-sm text-gray-800">Admin</span>
          </Link>
        </div>

        <nav className="px-3 py-4 space-y-1">
          <Link href="/admin">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 hover:text-primary hover:bg-orange-50 font-medium"
            >
              <LayoutDashboard className="h-4 w-4 mr-3" />
              Dashboard
            </Button>
          </Link>
          <Link href="/admin/bookings">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 hover:text-primary hover:bg-orange-50 font-medium"
            >
              <CalendarDays className="h-4 w-4 mr-3" />
              Bookings
            </Button>
          </Link>
          <Link href="/admin/check-in">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 hover:text-primary hover:bg-orange-50 font-medium"
            >
              <QrCode className="h-4 w-4 mr-3" />
              Check-In
            </Button>
          </Link>
          <Link href="/admin/routes">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 hover:text-primary hover:bg-orange-50 font-medium"
            >
              <Route className="h-4 w-4 mr-3" />
              Routes
            </Button>
          </Link>
          <Link href="/admin/users">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 hover:text-primary hover:bg-orange-50 font-medium"
            >
              <Users className="h-4 w-4 mr-3" />
              Users
            </Button>
          </Link>
          <Link href="/admin/settings">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 hover:text-primary hover:bg-orange-50 font-medium"
            >
              <Settings className="h-4 w-4 mr-3" />
              Email Settings
            </Button>
          </Link>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200">
          <form action="/api/auth/signout" method="POST">
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start text-gray-500 hover:text-red-600 hover:bg-red-50 font-medium"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sign Out
            </Button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-60 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
