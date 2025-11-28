"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { ProjectSwitcher } from "@/components/project/project-switcher";
import { MobileMenu } from "@/components/mobile-menu";
import { Button } from "@/components/ui/button";
import { NotificationMenu } from "@/components/notifications/notification-menu";

const labelMap: Record<string, string> = {
  "": "Dashboard",
  onboarding: "Onboarding",
  tickets: "Tickets",
  files: "Fichiers",
  billing: "Facturation",
  profile: "Profil",
  new: "Nouveau",
  edit: "Edition"
};

export interface NavbarProps {
  userName?: string | null;
  userEmail: string;
  role: "prospect" | "client" | "staff";
  projects: Array<{ id: string; name: string }>;
}

export function Navbar({ userName, userEmail, role, projects }: NavbarProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <header className="flex min-h-[64px] items-center justify-between border-b border-border bg-background/70 safe-px backdrop-blur sm:min-h-[72px] sm:px-6 md:h-20 md:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden sm:gap-6 md:gap-8">
        <MobileMenu role={role} />
        {pathname !== "/demo-in-progress" && (
          <Breadcrumb className="hidden md:flex">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              {segments.map((segment, index) => {
                const href = `/${segments.slice(0, index + 1).join("/")}`;
                const isLast = index === segments.length - 1;
                const label = labelMap[segment] ?? segment;

                return (
                  <BreadcrumbItem key={href}>
                    <BreadcrumbSeparator />
                    {isLast ? (
                      <BreadcrumbPage>{label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        )}
        {role !== "prospect" && <ProjectSwitcher projects={projects} role={role} />}
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Badge variant="secondary" className="hidden text-xs uppercase tracking-wide sm:inline-flex">
          {role}
        </Badge>
        <div className="hidden flex-col text-right text-xs leading-tight lg:flex lg:text-sm">
          <span className="font-medium text-foreground">{userName ?? userEmail}</span>
          <span className="text-muted-foreground">{userEmail}</span>
        </div>
        <Avatar className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10">
          <AvatarFallback className="text-xs sm:text-sm">{(userName ?? userEmail).slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        {role === "staff" ? <NotificationMenu /> : null}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="hidden min-h-[44px] sm:inline-flex"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span className="hidden md:inline">Se déconnecter</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-[44px] w-[44px] sm:hidden"
          onClick={() => signOut({ callbackUrl: "/login" })}
          aria-label="Se déconnecter"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

