"use client";

import * as React from "react";
import { Bell, Check, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  projectId: string | null;
  metadata: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

interface NotificationsResponse {
  data: NotificationItem[];
  unread: number;
}

async function fetchNotifications(status: "all" | "unread" = "all") {
  const response = await fetch(`/api/notifications?status=${status}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Impossible de charger les notifications.");
  }

  return (await response.json()) as NotificationsResponse;
}

async function markNotifications(payload: { ids?: string[]; all?: boolean }) {
  const response = await fetch("/api/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Impossible de marquer les notifications.");
  }

  return (await response.json()) as NotificationsResponse & { ok: boolean; updated: number };
}

export function NotificationMenu() {
  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const loadNotifications = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchNotifications("all");
      setItems(data.data);
      setUnreadCount(data.unread);
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger les notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadNotifications().catch(() => undefined);
  }, [loadNotifications]);

  const handleMarkAll = async () => {
    try {
      if (unreadCount === 0) {
        return;
      }
      const result = await markNotifications({ all: true });
      setItems((prev) => prev.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })));
      setUnreadCount(result.unread);
    } catch (error) {
      console.error(error);
      toast.error("Impossible de marquer toutes les notifications.");
    }
  };

  const handleMarkOne = async (id: string) => {
    try {
      const result = await markNotifications({ ids: [id] });
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, readAt: item.readAt ?? new Date().toISOString() } : item))
      );
      setUnreadCount(result.unread);
    } catch (error) {
      console.error(error);
      toast.error("Impossible de mettre à jour la notification.");
    }
  };

  const unreadBadge = unreadCount > 0 && (
    <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-xs font-medium text-destructive-foreground">
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  );

  return (
    <DropdownMenu open={open} onOpenChange={(nextOpen) => {
      setOpen(nextOpen);
      if (nextOpen) {
        loadNotifications().catch(() => undefined);
      }
    }}>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadBadge}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <DropdownMenuLabel className="flex items-center justify-between px-4 py-3 text-sm font-semibold">
          Notifications
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleMarkAll}
            disabled={unreadCount === 0 || loading}
          >
            <Check className="mr-1 h-4 w-4" />
            Tout lire
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center text-sm text-muted-foreground">
              <Inbox className="h-8 w-8 text-muted-foreground/70" />
              <p>Aucune notification pour le moment.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {items.map((item) => {
                const isUnread = !item.readAt;
                return (
                  <li key={item.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.body}</p>
                        <p className="text-xs text-muted-foreground/80">
                          {formatDate(item.createdAt, {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {isUnread ? <Badge variant="default">Nouveau</Badge> : null}
                        {isUnread ? (
                          <Button type="button" variant="ghost" size="sm" onClick={() => handleMarkOne(item.id)}>
                            Marquer lu
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
