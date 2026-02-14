import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import UserActions from "./user-actions";

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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-gray-500 dark:text-muted-foreground mt-1">Approve or manage admin users</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                {isSuperAdmin && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500 dark:text-muted-foreground">
                    No users yet.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.is_approved ? (
                        <Badge className="bg-orange-100 text-orange-700">Approved</Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.is_super_admin ? (
                        <Badge className="bg-gray-900 text-white">Super Admin</Badge>
                      ) : (
                        <span className="text-gray-500 dark:text-muted-foreground">Admin</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-500 dark:text-muted-foreground text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    {isSuperAdmin && (
                      <TableCell className="text-right">
                        <UserActions user={user} />
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
