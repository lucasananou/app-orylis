"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/toaster";
import { ProjectSelectionProvider } from "@/lib/project-selection";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ProjectSelectionProvider>
        {children}
        <Toaster />
      </ProjectSelectionProvider>
    </SessionProvider>
  );
}

