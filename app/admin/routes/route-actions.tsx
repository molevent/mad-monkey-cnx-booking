"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Edit, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { deleteRoute, toggleRouteActive } from "@/app/actions/routes";
import type { Route } from "@/lib/types";

interface Props {
  route: Route;
}

export default function RouteActions({ route }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleToggleActive = async () => {
    setLoading("toggle");
    const result = await toggleRouteActive(route.id, !route.is_active);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ 
        title: route.is_active ? "Route Deactivated" : "Route Activated",
        description: `${route.title} is now ${route.is_active ? "inactive" : "active"}`,
      });
      router.refresh();
    }
    setLoading(null);
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${route.title}"?`)) return;
    
    setLoading("delete");
    const result = await deleteRoute(route.id);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Route has been deleted" });
      router.refresh();
    }
    setLoading(null);
  };

  return (
    <div className="flex items-center gap-2 justify-end">
      <Link href={`/admin/routes/${route.id}/edit`}>
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </Link>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggleActive}
        disabled={loading !== null}
      >
        {loading === "toggle" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : route.is_active ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        disabled={loading !== null}
      >
        {loading === "delete" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4 text-red-500" />
        )}
      </Button>
    </div>
  );
}
