export interface OnboardingChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export interface OnboardingChecklistSummary {
  items: OnboardingChecklistItem[];
  completedCount: number;
  totalCount: number;
  completionRatio: number;
  nextAction: string | null;
}

const hasFilledString = (value: unknown): boolean =>
  typeof value === "string" && value.trim().length > 0;

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0) : [];

const isTruthyBoolean = (value: unknown): boolean => value === true;

export function summarizeOnboardingPayload(
  payload: Record<string, unknown> | null | undefined
): OnboardingChecklistSummary {
  const safePayload = payload ?? {};

  const identityComplete = hasFilledString(safePayload.fullName) && hasFilledString(safePayload.company) && hasFilledString(safePayload.phone);
  const objectivesComplete = toStringArray(safePayload.goals).length > 0;
  const customPagesCount =
    Array.isArray(safePayload.customPages) && safePayload.customPages
      ? (safePayload.customPages as Array<{ title?: unknown }>).filter(
        (page) => hasFilledString(page?.title)
      ).length
      : 0;
  const structureComplete = toStringArray(safePayload.pages).length + customPagesCount > 0;
  const inspirationComplete = toStringArray(safePayload.inspirations).length > 0;
  const technicalComplete = typeof safePayload.domainOwned === "boolean"
    ? (safePayload.domainOwned ? hasFilledString(safePayload.domainName) : true)
    : false;
  const validationComplete = isTruthyBoolean(safePayload.confirm);

  const items: OnboardingChecklistItem[] = [
    {
      id: "identity",
      title: "Identité & contact",
      description: "Informations sur ton entreprise et coordonnées de contact.",
      completed: identityComplete
    },
    {
      id: "objectives",
      title: "Objectifs",
      description: "Tes objectifs prioritaires et ta vision stratégique.",
      completed: objectivesComplete
    },
    {
      id: "structure",
      title: "Structure du site",
      description: "Pages essentielles et notes de contenu.",
      completed: structureComplete
    },
    {
      id: "inspirations",
      title: "Inspirations",
      description: "Références visuelles ou concurrentielles.",
      completed: inspirationComplete
    },
    {
      id: "technical",
      title: "Technique",
      description: "Domaine, hébergement et accès techniques.",
      completed: technicalComplete
    },
    {
      id: "validation",
      title: "Validation finale",
      description: "Confirmation et envoi de l'onboarding.",
      completed: validationComplete
    }
  ];

  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;
  const completionRatio = totalCount > 0 ? completedCount / totalCount : 0;
  const nextIncompleteItem = items.find((item) => !item.completed);

  // Texte plus naturel pour la prochaine action
  const getNaturalNextAction = (item: OnboardingChecklistItem | undefined): string | null => {
    if (!item) return null;
    const actionMap: Record<string, string> = {
      "Identité & contact": "informations sur ton entreprise",
      "Objectifs": "définir tes objectifs",
      "Structure du site": "structurer ton site",
      "Inspirations": "partager tes inspirations",
      "Technique": "configurer les aspects techniques",
      "Validation finale": "valider l'onboarding"
    };
    return actionMap[item.title] ?? item.title.toLowerCase();
  };

  return {
    items,
    completedCount,
    totalCount,
    completionRatio,
    nextAction: getNaturalNextAction(nextIncompleteItem)
  };
}
