"use client";

import * as React from "react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
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

export interface MobileMenuProps {
  role?: "client" | "staff";
}

export function MobileMenu({ role = "client" }: MobileMenuProps) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-[44px] w-[44px] md:hidden"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="border-b border-border px-6 py-6">
          <SheetTitle className="text-left">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Orylis
              </span>
              <p className="mt-2 text-lg font-semibold text-foreground">Hub</p>
            </div>
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-1 flex-col gap-1 px-4 py-6">
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
                onClick={() => setOpen(false)}
                className={cn(
                  "inline-flex min-h-[44px] items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
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
                    onClick={() => setOpen(false)}
                    className={cn(
                      "inline-flex min-h-[44px] items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
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
        <footer className="border-t border-border px-6 py-4 text-xs text-muted-foreground">
          Version MVP · {new Date().getFullYear()}
        </footer>
      </SheetContent>
    </Sheet>
  );
}

