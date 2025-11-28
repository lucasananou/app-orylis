"use client";

import * as React from "react";
import { Lock, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ProspectBannerProps {
  className?: string;
}

export function ProspectBanner({ className }: ProspectBannerProps) {
  return (
    <Card className={`border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/50 ${className ?? ""}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <Lock className="h-5 w-5 text-amber-700" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-amber-900">
                Vous utilisez actuellement la version prospect
              </h3>
              <p className="mt-1 text-sm text-amber-800">
                Devenez client pour débloquer toutes les fonctionnalités :
              </p>
            </div>
            <ul className="space-y-2 text-sm text-amber-800">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-700" />
                <span>Gestion des contenus</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-700" />
                <span>Tickets illimités</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-700" />
                <span>Suivi de projet complet</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-700" />
                <span>Support dédié</span>
              </li>
            </ul>
            <div className="pt-2">
              <Button size="sm" variant="outline" className="border-amber-300 text-amber-900 hover:bg-amber-100" asChild>
                <Link href="/demo">
                  Découvrir les avantages
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

