"use client";

import { useState } from "react";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Clock,
  ChevronDown,
  ChevronUp,
  User,
  Monitor,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ActivityEntry {
  id: string;
  created_at: string;
  action: string;
  description: string;
  actor_type: string;
  actor_email: string | null;
  metadata: Record<string, any>;
  level: string;
}

interface Props {
  activities: ActivityEntry[];
}

const levelConfig: Record<string, { icon: typeof Info; color: string; bg: string }> = {
  info: { icon: Info, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
  success: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" },
  warning: { icon: AlertTriangle, color: "text-yellow-600", bg: "bg-yellow-100 dark:bg-yellow-900/30" },
  error: { icon: XCircle, color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30" },
};

const actorIcon: Record<string, typeof User> = {
  admin: Shield,
  customer: User,
  system: Monitor,
};

function formatRelativeTime(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ActivityLog({ activities }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showMetadata, setShowMetadata] = useState<string | null>(null);

  const displayActivities = expanded ? activities : activities.slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Activity History
          <Badge variant="secondary" className="ml-auto font-mono text-xs">
            {activities.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-muted-foreground text-center py-6">
            No activity recorded yet.
          </p>
        ) : (
          <div className="space-y-0">
            {displayActivities.map((activity, index) => {
              const config = levelConfig[activity.level] || levelConfig.info;
              const LevelIcon = config.icon;
              const ActorIcon = actorIcon[activity.actor_type] || Monitor;
              const hasMetadata = activity.metadata && Object.keys(activity.metadata).length > 0;

              return (
                <div key={activity.id} className="relative">
                  {/* Timeline line */}
                  {index < displayActivities.length - 1 && (
                    <div className="absolute left-[15px] top-[32px] bottom-0 w-px bg-gray-200 dark:bg-border" />
                  )}

                  <div className="flex gap-3 pb-4">
                    {/* Icon */}
                    <div className={`shrink-0 w-[30px] h-[30px] rounded-full flex items-center justify-center ${config.bg}`}>
                      <LevelIcon className={`h-3.5 w-3.5 ${config.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-gray-400 dark:text-muted-foreground">
                          {formatRelativeTime(activity.created_at)}
                        </span>
                        <span className="text-xs text-gray-300 dark:text-gray-600">•</span>
                        <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-muted-foreground">
                          <ActorIcon className="h-3 w-3" />
                          {activity.actor_type}
                          {activity.actor_email && ` (${activity.actor_email})`}
                        </span>
                        {hasMetadata && (
                          <button
                            onClick={() => setShowMetadata(showMetadata === activity.id ? null : activity.id)}
                            className="text-xs text-primary hover:underline"
                          >
                            {showMetadata === activity.id ? "hide details" : "details"}
                          </button>
                        )}
                      </div>

                      {/* Metadata expandable */}
                      {showMetadata === activity.id && hasMetadata && (
                        <pre className="mt-2 p-2 bg-gray-50 dark:bg-secondary rounded text-xs overflow-x-auto text-gray-600 dark:text-gray-300">
                          {JSON.stringify(activity.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activities.length > 5 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-gray-500 dark:text-muted-foreground"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Show All ({activities.length} entries)
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
