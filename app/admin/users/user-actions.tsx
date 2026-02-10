"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase/client";

interface AdminUser {
  id: string;
  auth_id: string;
  email: string;
  full_name: string;
  is_approved: boolean;
  is_super_admin: boolean;
}

interface Props {
  user: AdminUser;
}

export default function UserActions({ user }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleApprove = async () => {
    setLoading("approve");
    const supabase = createClient();
    const { error } = await supabase
      .from("admin_users")
      .update({ is_approved: true })
      .eq("id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Approved", description: `${user.full_name} has been approved.` });
      router.refresh();
    }
    setLoading(null);
  };

  const handleRevoke = async () => {
    if (!confirm(`Revoke access for ${user.full_name}?`)) return;
    setLoading("revoke");
    const supabase = createClient();
    const { error } = await supabase
      .from("admin_users")
      .update({ is_approved: false })
      .eq("id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Revoked", description: `Access revoked for ${user.full_name}.` });
      router.refresh();
    }
    setLoading(null);
  };

  if (user.is_super_admin) {
    return <span className="text-xs text-gray-400">Protected</span>;
  }

  return (
    <div className="flex items-center gap-2 justify-end">
      {!user.is_approved ? (
        <Button
          size="sm"
          onClick={handleApprove}
          disabled={loading !== null}
        >
          {loading === "approve" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Check className="h-4 w-4 mr-1" />
              Approve
            </>
          )}
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={handleRevoke}
          disabled={loading !== null}
        >
          {loading === "revoke" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <X className="h-4 w-4 mr-1" />
              Revoke
            </>
          )}
        </Button>
      )}
    </div>
  );
}
