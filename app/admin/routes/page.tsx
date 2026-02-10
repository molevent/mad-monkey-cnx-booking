import Link from "next/link";
import Image from "next/image";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
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
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import RouteActions from "./route-actions";
import type { Route } from "@/lib/types";

async function getRoutes(): Promise<Route[]> {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("routes")
    .select("*")
    .order("created_at", { ascending: false });

  return data || [];
}

export default async function RoutesPage() {
  const routes = await getRoutes();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Routes</h1>
        <Link href="/admin/routes/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Route
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No routes yet. Create your first route!
                  </TableCell>
                </TableRow>
              ) : (
                routes.map((route) => (
                  <TableRow key={route.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {route.cover_image_url && (
                          <div className="relative h-12 w-16 rounded overflow-hidden">
                            <Image
                              src={route.cover_image_url}
                              alt={route.title}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{route.title}</p>
                          <p className="text-sm text-gray-500 truncate max-w-xs">
                            {(route.description || "").substring(0, 50)}...
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{route.difficulty}</Badge>
                    </TableCell>
                    <TableCell>{route.duration}</TableCell>
                    <TableCell>{formatPrice(route.price)}</TableCell>
                    <TableCell>
                      {route.is_active ? (
                        <Badge className="bg-orange-100 text-orange-700">Active</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-700">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <RouteActions route={route} />
                    </TableCell>
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
