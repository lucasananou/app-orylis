"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

interface NotificationPreferencesState {
  emailNotifications: boolean;
  ticketUpdates: boolean;
  fileUpdates: boolean;
  billingUpdates: boolean;
  onboardingUpdates: boolean;
  marketing: boolean;
}

const defaultState: NotificationPreferencesState = {
  emailNotifications: true,
  ticketUpdates: true,
  fileUpdates: true,
  billingUpdates: true,
  onboardingUpdates: true,
  marketing: false
};

const preferenceDefinitions: Array<{
  key: keyof NotificationPreferencesState;
  label: string;
  description: string;
}> = [
  {
    key: "emailNotifications",
    label: "Recevoir les notifications par email",
    description: "Envoi automatique d’un email lorsqu’une notification importante est créée."
  },
  {
    key: "ticketUpdates",
    label: "Tickets",
    description: "Création ou mise à jour d’un ticket de support."
  },
  {
    key: "fileUpdates",
    label: "Fichiers",
    description: "Ajout d’un livrable ou d’une ressource dans l’espace fichiers."
  },
  {
    key: "billingUpdates",
    label: "Facturation",
    description: "Nouveau lien de paiement ou document comptable partagé."
  },
  {
    key: "onboardingUpdates",
    label: "Onboarding",
    description: "Avancement des étapes clés de l’onboarding projet."
  },
  {
    key: "marketing",
    label: "Actualités Orylis",
    description: "Recevoir nos annonces produits et événements (optionnel)."
  }
];

export function NotificationPreferencesForm() {
  const [state, setState] = React.useState<NotificationPreferencesState>(defaultState);
  const [loading, setLoading] = React.useState(true);
  const [updatingKey, setUpdatingKey] = React.useState<keyof NotificationPreferencesState | null>(null);

  const fetchPreferences = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notifications/preferences", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Erreur de chargement des préférences.");
      }
      const payload = (await response.json()) as { data: NotificationPreferencesState };
      setState((prev) => ({ ...prev, ...payload.data }));
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger les préférences de notification.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPreferences().catch(() => undefined);
  }, [fetchPreferences]);

  const togglePreference = async (key: keyof NotificationPreferencesState) => {
    try {
      setUpdatingKey(key);
      const nextValue = !state[key];
      setState((prev) => ({ ...prev, [key]: nextValue }));

      const response = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: nextValue })
      });

      if (!response.ok) {
        throw new Error("Échec de la mise à jour");
      }

      toast.success("Préférence mise à jour.");
    } catch (error) {
      console.error(error);
      toast.error("Impossible de mettre à jour cette préférence.");
      setState((prev) => ({ ...prev, [key]: !prev[key] }));
    } finally {
      setUpdatingKey(null);
    }
  };

  return (
    <div className="space-y-4">
      {preferenceDefinitions.map((preference) => {
        const value = state[preference.key];
        const isUpdating = updatingKey === preference.key;
        return (
          <div
            key={preference.key}
            className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:px-6"
          >
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{preference.label}</p>
              <p className="text-sm text-muted-foreground">{preference.description}</p>
            </div>
            <Button
              type="button"
              variant={value ? "default" : "outline"}
              className="min-w-[150px]"
              onClick={() => togglePreference(preference.key)}
              disabled={loading || isUpdating}
            >
              {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {value ? "Activé" : "Désactivé"}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
