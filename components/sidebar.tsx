"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FileText,
  Ticket,
  FolderOpen,
  CreditCard,
  UserRound
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/onboarding", label: "Onboarding", icon: FileText },
  { href: "/tickets", label: "Tickets", icon: Ticket },
  { href: "/files", label: "Fichiers", icon: FolderOpen },
  { href: "/billing", label: "Facturation", icon: CreditCard },
  { href: "/profile", label: "Profil", icon: UserRound }
];

export interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full w-64 shrink-0 flex-col border-r border-border bg-card/40 px-5 py-8",
        className
      )}
    >
      <div className="mb-10">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Orylis
        </span>
        <p className="mt-2 text-lg font-semibold text-foreground">Hub</p>
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isRoot = item.href === "/";
          const isActive = pathname === item.href;
          const isNested =
            !isRoot &&
            (pathname === item.href || pathname?.startsWith(`${item.href}/`));
          const active = isRoot ? isActive : isNested;

          return (
            <Link
              key={item.href}
              href={{ pathname: item.href }}
              className={cn(
                "inline-flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                active
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <footer className="mt-auto pt-8 text-xs text-muted-foreground">
        Version MVP · {new Date().getFullYear()}
      </footer>
    </aside>
  );
}

