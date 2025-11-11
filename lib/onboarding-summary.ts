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
  const objectivesComplete = toStringArray(safePayload.goals).length > 0 && hasFilledString(safePayload.primaryGoal);
  const structureComplete = toStringArray(safePayload.pages).length > 0;
  const inspirationComplete = toStringArray(safePayload.inspirations).length > 0;
  const technicalComplete = isTruthyBoolean(safePayload.domainOwned)
    ? hasFilledString(safePayload.domainName)
    : true;
  const validationComplete = isTruthyBoolean(safePayload.confirm);

  const items: OnboardingChecklistItem[] = [
    {
      id: "identity",
      title: "Identité & contact",
      description: "Coordonnées complètes du contact principal.",
      completed: identityComplete
    },
    {
      id: "objectives",
      title: "Objectifs",
      description: "Objectifs prioritaires et vision stratégique.",
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

  return {
    items,
    completedCount,
    totalCount,
    completionRatio,
    nextAction: nextIncompleteItem ? nextIncompleteItem.title : null
  };
}
