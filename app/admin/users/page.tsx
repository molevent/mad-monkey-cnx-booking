import { createServerSupabaseClient } from "@/lib/supabase/server";
import UsersContent from "./users-content";

interface AdminUser {
  id: string;
  auth_id: string;
  email: string;
  full_name: string;
  is_approved: boolean;
  is_super_admin: boolean;
  created_at: string;
}

async function getAdminUsers(): Promise<AdminUser[]> {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("admin_users")
    .select("*")
    .order("created_at", { ascending: false });
  return data || [];
}

async function getCurrentUser() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("is_super_admin")
    .eq("auth_id", user.id)
    .single();
  return adminUser;
}

export default async function UsersPage() {
  const users = await getAdminUsers();
  const currentUser = await getCurrentUser();
  const isSuperAdmin = currentUser?.is_super_admin || false;
  return <UsersContent users={users} isSuperAdmin={isSuperAdmin} />;
}
