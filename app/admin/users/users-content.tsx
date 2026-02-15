"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useI18n } from "@/lib/i18n/context";
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

interface Props {
  users: AdminUser[];
  isSuperAdmin: boolean;
}

export default function UsersContent({ users, isSuperAdmin }: Props) {
  const { t } = useI18n();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("admin.user_management")}</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.name")}</TableHead>
                <TableHead>{t("admin.email")}</TableHead>
                <TableHead>{t("admin.status_label")}</TableHead>
                <TableHead>{t("admin.role")}</TableHead>
                <TableHead>{t("admin.date")}</TableHead>
                {isSuperAdmin && (
                  <TableHead className="text-right">{t("admin.actions")}</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500 dark:text-muted-foreground">
                    {t("admin.no_users")}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.is_approved ? (
                        <Badge className="bg-orange-100 text-orange-700">{t("admin.approved")}</Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-700">{t("admin.pending")}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.is_super_admin ? (
                        <Badge className="bg-gray-900 text-white">Super Admin</Badge>
                      ) : (
                        <span className="text-gray-500 dark:text-muted-foreground">{t("admin.admin")}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-500 dark:text-muted-foreground text-sm" suppressHydrationWarning>
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
