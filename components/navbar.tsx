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
  role: "client" | "staff";
  projects: Array<{ id: string; name: string }>;
}

export function Navbar({ userName, userEmail, role, projects }: NavbarProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <header className="flex h-20 items-center justify-between border-b border-border bg-background/70 px-8 backdrop-blur">
      <div className="flex flex-1 items-center gap-8">
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
        <ProjectSwitcher projects={projects} role={role} />
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="uppercase tracking-wide">
          {role}
        </Badge>
        <div className="hidden flex-col text-right text-sm leading-tight md:flex">
          <span className="font-medium text-foreground">{userName ?? userEmail}</span>
          <span className="text-muted-foreground">{userEmail}</span>
        </div>
        <Avatar>
          <AvatarFallback>{(userName ?? userEmail).slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <NotificationMenu />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="hidden sm:inline-flex"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Se déconnecter
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="sm:hidden"
          onClick={() => signOut({ callbackUrl: "/login" })}
          aria-label="Se déconnecter"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

