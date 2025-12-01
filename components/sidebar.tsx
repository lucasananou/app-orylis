"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FileText,
  Ticket,
  FolderOpen,
  CreditCard,
  UserRound,
  Settings,
  Receipt,
  Sparkles,
  Gift,
  BookOpen,
  Rocket,
  LogOut
} from "lucide-react";
import { cn, canAccessTickets, canAccessFiles, canAccessBilling, type UserRole } from "@/lib/utils";

const navItems: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/onboarding", label: "Onboarding", icon: FileText },
  { href: "/tickets", label: "Tickets", icon: Ticket },
  { href: "/files", label: "Fichiers", icon: FolderOpen },
  { href: "/marketplace", label: "Booster", icon: Rocket },
  { href: "/services", label: "Services", icon: Sparkles },
  { href: "/guide", label: "Guide", icon: BookOpen },
  { href: "/referral", label: "Parrainage", icon: Gift },
  { href: "/profile", label: "Profil", icon: UserRound }
];

const adminNavItems: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "/admin/clients", label: "Gestion des clients", icon: UserRound },
  { href: "/admin/invite", label: "Inviter un prospect", icon: UserRound },
  { href: "/admin/quotes", label: "Gestion des devis", icon: Receipt },
  { href: "/admin/invoices", label: "Gestion des factures", icon: FileText },
  { href: "/admin/emails", label: "Gestion des emails", icon: Settings }
];

export interface SidebarProps {
  className?: string;
  role?: UserRole;
  hasDeliveredProject?: boolean;
}

export function Sidebar({ className, role = "client", hasDeliveredProject = false }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "hidden h-full w-64 shrink-0 flex-col border-r border-border bg-card/40 px-4 py-6 md:flex lg:px-5 lg:py-8",
        className
      )}
    >
      <div className="mb-8 lg:mb-10">
        <Link href="/" className="block">
          <Image
            src="https://orylis.fr/wp-content/uploads/2023/08/Frame-454507529-1.png"
            alt="Orylis"
            width={120}
            height={40}
            className="h-auto w-auto"
            priority
          />
        </Link>
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

          // Masquer les items non pertinents pour le staff
          if (role === "staff" && ["/onboarding", "/services", "/referral"].includes(item.href)) {
            return null;
          }

          // Masquer les tickets si aucun projet livré (uniquement pour les clients, les prospects les voient grisés)
          if (item.href === "/tickets" && role === "client" && !hasDeliveredProject) {
            return null;
          }

          // Vérifier les permissions pour tickets, files, billing
          // Pour les prospects, tout est restreint sauf Dashboard et Onboarding
          const isProspectRestricted = role === "prospect" && !["/", "/onboarding"].includes(item.href);

          const isRestricted =
            isProspectRestricted ||
            (item.href === "/tickets" && !canAccessTickets(role)) ||
            (item.href === "/files" && !canAccessFiles(role)) ||
            (item.href === "/billing" && !canAccessBilling(role));

          const content = (
            <div
              className={cn(
                "inline-flex min-h-[44px] w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200 lg:px-4 lg:py-3",
                isRestricted
                  ? "cursor-not-allowed opacity-50"
                  : active
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:bg-[rgba(0,0,0,0.03)] hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </div>
          );

          if (isRestricted) {
            return (
              <div key={item.href} title={role === "prospect" ? "Complétez votre onboarding pour accéder" : "Réservé aux clients"}>
                {content}
              </div>
            );
          }

          return (
            <Link key={item.href} href={{ pathname: item.href }} prefetch>
              {content}
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
                  prefetch
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

      <div className="mt-auto pt-6 lg:pt-8">
        <button
          onClick={() => import("next-auth/react").then(({ signOut }) => signOut())}
          className="inline-flex min-h-[44px] w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-red-50 hover:text-red-600 lg:px-4 lg:py-3"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Se déconnecter</span>
        </button>
        <footer className="mt-4 text-xs text-muted-foreground">
          Version MVP · {new Date().getFullYear()}
        </footer>
      </div>
    </aside>
  );
}

