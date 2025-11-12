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
  UserRound,
  Settings
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

const adminNavItems: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "/admin/emails", label: "Gestion des emails", icon: Settings }
];

export interface SidebarProps {
  className?: string;
  role?: "client" | "staff";
}

export function Sidebar({ className, role = "client" }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "hidden h-full w-64 shrink-0 flex-col border-r border-border bg-card/40 px-4 py-6 md:flex lg:px-5 lg:py-8",
        className
      )}
    >
      <div className="mb-8 lg:mb-10">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Orylis
        </span>
        <p className="mt-2 text-lg font-semibold text-foreground">Hub</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5 lg:gap-2">
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
                "inline-flex min-h-[44px] items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200 lg:px-4 lg:py-3",
                active
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:bg-[rgba(0,0,0,0.03)] hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        {role === "staff" && (
          <>
            <div className="my-2 border-t border-border" />
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={{ pathname: item.href }}
                  className={cn(
                    "inline-flex min-h-[44px] items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200 lg:px-4 lg:py-3",
                    isActive
                      ? "bg-accent/10 text-accent"
                      : "text-muted-foreground hover:bg-[rgba(0,0,0,0.03)] hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>
      <footer className="mt-auto pt-6 text-xs text-muted-foreground lg:pt-8">
        Version MVP · {new Date().getFullYear()}
      </footer>
    </aside>
  );
}

