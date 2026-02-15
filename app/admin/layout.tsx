import { createServerSupabaseClient } from "@/lib/supabase/server";
import SessionTimeout from "./session-timeout";
import AdminShell from "./admin-shell";

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
    <AdminShell>
      <SessionTimeout />
      {children}
    </AdminShell>
  );
}
