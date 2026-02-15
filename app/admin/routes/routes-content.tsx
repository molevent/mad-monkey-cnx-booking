"use client";

import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import { formatPrice } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import RouteActions from "./route-actions";
import type { Route } from "@/lib/types";

interface Props {
  routes: Route[];
}

export default function RoutesContent({ routes }: Props) {
  const { t } = useI18n();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{t("admin.routes")}</h1>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/admin/routes/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("admin.create_route")}
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent>{t("tip.create_route")}</TooltipContent>
        </Tooltip>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.route")}</TableHead>
                <TableHead>{t("admin.difficulty")}</TableHead>
                <TableHead>{t("admin.duration")}</TableHead>
                <TableHead>{t("admin.price")}</TableHead>
                <TableHead>{t("admin.status_label")}</TableHead>
                <TableHead className="text-right">{t("admin.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500 dark:text-muted-foreground">
                    {t("admin.no_results")}
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
                          <p className="text-sm text-gray-500 dark:text-muted-foreground truncate max-w-xs">
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
                        <Badge className="bg-orange-100 text-orange-700">{t("admin.active")}</Badge>
                      ) : (
                        <Badge className="bg-gray-100 dark:bg-secondary text-gray-700 dark:text-gray-300">{t("admin.inactive")}</Badge>
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
