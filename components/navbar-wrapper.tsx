"use client";

import { usePathname } from "next/navigation";
import { Navbar, type NavbarProps } from "@/components/navbar";
import { isProspect } from "@/lib/utils";

export function NavbarWrapper(props: NavbarProps) {
  const pathname = usePathname();
  const isProspectOnOnboarding = isProspect(props.role) && pathname === "/onboarding";

  if (isProspectOnOnboarding) {
    return null;
  }

  return <Navbar {...props} />;
}

