import { z } from "zod";

const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z
    .union([schema, z.literal("")])
    .transform((value) => (value === "" ? undefined : value))
    .optional();

export const loginSchema = z.object({
  email: z.string().email({ message: "Merci d’entrer un email valide." })
});

export const passwordLoginSchema = z.object({
  email: z.string().email({ message: "Merci d’entrer un email valide." }),
  password: z
    .string()
    .min(8, { message: "Le mot de passe doit contenir au moins 8 caractères." })
    .max(128, { message: "Le mot de passe est trop long." })
});

export const profileSchema = z.object({
  fullName: emptyToUndefined(
    z
      .string()
      .min(2, { message: "Le nom doit contenir au moins 2 caractères." })
      .max(120, { message: "Le nom dépasse 120 caractères." })
  ),
  company: emptyToUndefined(
    z.string().max(120, { message: "La raison sociale dépasse 120 caractères." })
  ),
  phone: emptyToUndefined(
    z
      .string()
      .regex(/^[0-9 +().-]*$/, { message: "Format de téléphone invalide." })
      .max(30, { message: "Numéro trop long (30 caractères max)." })
  )
});

export const OnboardingStep1Schema = z.object({
  fullName: emptyToUndefined(
    z
      .string()
      .min(2, { message: "Le nom doit contenir au moins 2 caractères." })
      .max(120, { message: "Le nom dépasse 120 caractères." })
  ),
  company: emptyToUndefined(
    z
      .string()
      .min(2, { message: "Merci d’indiquer un nom d’entreprise valide." })
      .max(150, { message: "La raison sociale dépasse 150 caractères." })
  ),
  phone: emptyToUndefined(
    z
      .string()
      .regex(/^[0-9\s+().-]{8,30}$/, {
        message: "Indiquez un numéro valide (chiffres, +, espaces, . ou -)."
      })
  ),
  website: emptyToUndefined(z.string().max(200, { message: "Merci de rester sous 200 caractères." }))
});

export const OnboardingStep2Schema = z.object({
  goals: z
    .array(z.string())
    .min(1, { message: "Sélectionnez au moins un objectif." })
    .max(5, { message: "Merci de limiter à 5 objectifs." }),
  description: emptyToUndefined(
    z
      .string()
      .max(2000, { message: "Merci de rester sous 2000 caractères." })
  )
});

const CustomPageSchema = z.object({
  title: z
    .string()
    .min(2, { message: "Le titre doit contenir au moins 2 caractères." })
    .max(120, { message: "Le titre est trop long (120 caractères max)." }),
  description: emptyToUndefined(
    z
      .string()
      .max(2000, { message: "Merci de rester sous 2000 caractères." })
  )
});

export const OnboardingStep3Schema = z.object({
  pages: z
    .array(z.string())
    .max(10, { message: "Merci de limiter à 10 pages principales." }),
  customPages: z
    .array(CustomPageSchema)
    .max(20, { message: "Merci de limiter à 20 pages personnalisées." })
    .optional(),
  contentsNote: emptyToUndefined(
    z
      .string()
      .max(2000, { message: "Merci de rester sous 2000 caractères." })
  )
});

const inspirationEntrySchema = z
  .string()
  .trim()
  .min(2, { message: "Merci de préciser cette référence." })
  .max(200, { message: "200 caractères maximum par entrée." });

export const OnboardingStep4Schema = z.object({
  inspirations: z
    .array(inspirationEntrySchema)
    .max(8, { message: "8 inspirations maximum." })
    .optional(),
  competitors: z.array(inspirationEntrySchema).max(8, { message: "8 concurrents maximum." }).optional()
});

const OnboardingStep5Fields = z.object({
  domainOwned: z.boolean(),
  domainName: emptyToUndefined(
    z
      .string()
      .min(2, { message: "Nom de domaine trop court." })
      .max(120, { message: "Nom de domaine trop long." })
  ),
  hostingNotes: emptyToUndefined(
    z
      .string()
      .max(1200, { message: "Merci de rester sous 1200 caractères." })
  )
});

export const OnboardingStep5Schema = OnboardingStep5Fields.refine(
  (data) => {
    if (data.domainOwned) {
      return Boolean(data.domainName);
    }
    return true;
  },
  {
    message: "Merci de préciser le nom de domaine.",
    path: ["domainName"]
  }
);

export const OnboardingPayloadFields = OnboardingStep1Schema.merge(OnboardingStep2Schema)
  .merge(OnboardingStep3Schema)
  .merge(OnboardingStep4Schema)
  .merge(OnboardingStep5Fields);

// Schéma permissif pour les brouillons (autosave) - tous les champs sont optionnels
export const OnboardingDraftSchema = z.object({
  fullName: z.string().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  goals: z.array(z.string()).optional(),
  description: z.string().optional(),
  pages: z.array(z.string()).optional(),
  customPages: z
    .array(
      z.object({
        title: z.string(),
        description: z.string().optional()
      })
    )
    .optional(),
  contentsNote: z.string().optional(),
  inspirations: z.array(z.string()).optional(),
  competitors: z.array(z.string()).optional(),
  domainOwned: z.boolean().optional(),
  domainName: z.string().optional(),
  hostingNotes: z.string().optional()
});

export const OnboardingPayloadSchema = OnboardingPayloadFields.superRefine((data, ctx) => {
  if (data.domainOwned && !data.domainName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Merci de préciser le nom de domaine.",
      path: ["domainName"]
    });
  }

  const selectedPages = Array.isArray(data.pages) ? data.pages.length : 0;
  const customPagesCount = Array.isArray(data.customPages) ? data.customPages.length : 0;
  if (selectedPages + customPagesCount < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Ajoutez au moins une page, existante ou personnalisée.",
      path: ["pages"]
    });
  }
});

export const OnboardingFinalSchema = OnboardingPayloadFields.merge(
  z.object({
    confirm: z.literal(true, {
      errorMap: () => ({ message: "Merci de confirmer la validation de l’onboarding." })
    })
  })
).superRefine((data, ctx) => {
  if (data.domainOwned && !data.domainName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Merci de préciser le nom de domaine.",
      path: ["domainName"]
    });
  }

  const selectedPages = Array.isArray(data.pages) ? data.pages.length : 0;
  const customPagesCount = Array.isArray(data.customPages) ? data.customPages.length : 0;
  if (selectedPages + customPagesCount < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Ajoutez au moins une page, existante ou personnalisée.",
      path: ["pages"]
    });
  }
});

export const ticketCategoryOptions = ["request", "feedback", "issue", "general"] as const;

export const ticketCreateSchema = z.object({
  projectId: z.string().uuid({ message: "Projet invalide." }),
  title: z
    .string()
    .min(4, { message: "Le titre doit contenir au moins 4 caractères." })
    .max(120, { message: "Le titre est trop long." }),
  description: z
    .string()
    .min(12, { message: "Décrivez votre demande en quelques lignes." })
    .max(4000, { message: "Merci de rester synthétique (4000 caractères max)." }),
  category: z.enum(ticketCategoryOptions).default("request"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  files: z
    .array(
      z.object({
        name: z.string(),
        size: z.number(),
        type: z.string(),
        url: z.string()
      })
    )
    .optional()
});

export const ticketUpdateSchema = z
  .object({
    title: z
      .string()
      .min(4, { message: "Le titre doit contenir au moins 4 caractères." })
      .max(120, { message: "Le titre est trop long." })
      .optional(),
    description: z
      .string()
      .min(12, { message: "Décrivez votre demande en quelques lignes." })
      .max(4000, { message: "Merci de rester synthétique (4000 caractères max)." })
      .optional(),
    status: z.enum(["open", "in_progress", "done"]).optional(),
    category: z.enum(ticketCategoryOptions).optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional()
  })
  .refine(
    (value) =>
      Boolean(
        value.title ?? value.description ?? value.status ?? value.category ?? value.priority
      ),
    {
      message: "Aucun changement détecté.",
      path: ["status"]
    }
  );

export const knowledgeArticleCreateSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Le titre doit contenir au moins 3 caractères." })
    .max(200, { message: "Le titre dépasse 200 caractères." }),
  content: z
    .string()
    .min(10, { message: "Le contenu doit contenir au moins 10 caractères." })
    .max(50000, { message: "Le contenu dépasse 50000 caractères." }),
  category: z.string().max(50).optional(),
  published: z.boolean().default(true)
});

export const knowledgeArticleUpdateSchema = knowledgeArticleCreateSchema.partial();

export type KnowledgeArticleCreatePayload = z.infer<typeof knowledgeArticleCreateSchema>;

export const ticketMessageSchema = z.object({
  body: z
    .string()
    .min(2, { message: "Merci de saisir un message (2 caractères minimum)." })
    .max(4000, { message: "Merci de rester synthétique (4000 caractères maximum)." }),
  isInternal: z.boolean().optional().default(false),
  files: z
    .array(
      z.object({
        name: z.string(),
        size: z.number(),
        type: z.string(),
        url: z.string()
      })
    )
    .optional()
});

export type TicketMessagePayload = z.infer<typeof ticketMessageSchema>;

export const billingLinkSchema = z.object({
  projectId: z.string().uuid({ message: "Projet invalide." }),
  label: z
    .string()
    .min(3, { message: "Le libellé doit contenir au moins 3 caractères." })
    .max(120, { message: "Le libellé dépasse 120 caractères." }),
  url: z.string().url({ message: "Merci de fournir une URL valide." })
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type PasswordLoginFormValues = z.infer<typeof passwordLoginSchema>;
export type ProfileFormValues = z.infer<typeof profileSchema>;
export type OnboardingPayload = z.infer<typeof OnboardingPayloadSchema>;
export type OnboardingFinalPayload = z.infer<typeof OnboardingFinalSchema>;
export type TicketCreateFormValues = z.infer<typeof ticketCreateSchema>;
export type TicketUpdatePayload = z.infer<typeof ticketUpdateSchema>;
export type BillingLinkFormValues = z.infer<typeof billingLinkSchema>;

export const clientCreateSchema = z.object({
  fullName: emptyToUndefined(
    z
      .string()
      .min(2, { message: "Le nom doit contenir au moins 2 caractères." })
      .max(120, { message: "Le nom dépasse 120 caractères." })
  ),
  email: z.string().email({ message: "Merci d’entrer un email valide." }),
  password: z
    .string()
    .min(8, { message: "Le mot de passe doit contenir au moins 8 caractères." })
    .max(128, { message: "Le mot de passe est trop long." }),
  role: z.enum(["prospect", "client"]).optional().default("prospect")
});

export const clientCreateFormSchema = clientCreateSchema
  .extend({
    passwordConfirm: z
      .string()
      .min(8, { message: "La confirmation doit contenir au moins 8 caractères." })
      .max(128, { message: "La confirmation est trop longue." })
  })
  .refine((values) => values.password === values.passwordConfirm, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["passwordConfirm"]
  });

export type ClientCreateFormValues = z.infer<typeof clientCreateFormSchema>;
export type ClientCreatePayload = z.infer<typeof clientCreateSchema>;

const allowedFileTypes = [
  "image/png",
  "image/jpeg",
  "application/pdf",
  "application/zip",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
] as const;

export const fileMetaSchema = z.object({
  projectId: z.string().uuid({ message: "Projet invalide." }),
  filename: z
    .string()
    .min(1, { message: "Le nom de fichier est requis." })
    .max(200, { message: "Nom de fichier trop long." }),
  type: z.enum(allowedFileTypes, {
    errorMap: () => ({
      message: "Format de fichier non supporté."
    })
  }),
  size: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024, { message: "Taille maximale 10 Mo." })
});

export type FileMetaPayload = z.infer<typeof fileMetaSchema>;

export const projectSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: z.enum(["onboarding", "design", "build", "review", "delivered"]),
  progress: z.number().int().min(0).max(100),
  dueDate: z.string().nullable(),
  ownerId: z.string().min(1)
});

export type ProjectSummary = z.infer<typeof projectSummarySchema>;

export const profileUpdateSchema = z
  .object({
    full_name: emptyToUndefined(
      z
        .string()
        .min(2, { message: "Le nom doit contenir au moins 2 caractères." })
        .max(120, { message: "Le nom dépasse 120 caractères." })
    ),
    company: emptyToUndefined(
      z.string().max(120, { message: "La raison sociale dépasse 120 caractères." })
    ),
    phone: emptyToUndefined(
      z
        .string()
        .regex(/^[0-9 +().-]*$/, { message: "Format de téléphone invalide." })
        .max(30, { message: "Numéro trop long (30 caractères max)." })
    )
  })
  .refine(
    (values) => Object.values(values).some((value) => value !== undefined),
    {
      message: "Aucun changement détecté.",
      path: ["full_name"]
    }
  );

export const projectCreateSchema = z.object({
  ownerId: z
    .string()
    .min(1, { message: "Client invalide." }),
  name: z
    .string()
    .min(3, { message: "Le nom doit contenir au moins 3 caractères." })
    .max(120, { message: "Nom trop long (120 caractères max)." }),
  status: z.enum(["onboarding", "design", "build", "review", "delivered"]).optional(),
  progress: z
    .number()
    .int()
    .min(0, { message: "Progression minimale 0%." })
    .max(100, { message: "Progression maximale 100%." })
    .optional()
  // dueDate retiré de la création (peut être ajouté plus tard via l'édition)
});

export const projectUpdateSchema = z
  .object({
    name: z
      .string()
      .min(3, { message: "Le nom doit contenir au moins 3 caractères." })
      .max(120, { message: "Nom trop long (120 caractères max)." })
      .optional(),
    status: z.enum(["onboarding", "design", "build", "review", "delivered"]).optional(),
    progress: z
      .number()
      .int()
      .min(0, { message: "Progression minimale 0%." })
      .max(100, { message: "Progression maximale 100%." })
      .optional(),
    dueDate: z
      .string()
      .datetime({ message: "La date doit être une ISO valide." })
      .optional()
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "Aucun changement détecté.",
    path: ["name"]
  });

export type ProfileUpdatePayload = z.infer<typeof profileUpdateSchema>;
export type ProjectCreatePayload = z.infer<typeof projectCreateSchema>;
export type ProjectUpdatePayload = z.infer<typeof projectUpdateSchema>;

export const notificationMarkSchema = z
  .object({
    ids: z.array(z.string().uuid()).optional(),
    all: z.boolean().optional()
  })
  .refine(
    (value) => Boolean(value.all) || (Array.isArray(value.ids) && value.ids.length > 0),
    {
      message: "Précisez les notifications à marquer ou utilisez all=true.",
      path: ["ids"]
    }
  );

// ============================================
// Schémas pour le formulaire d'onboarding PROSPECT (simplifié)
// ============================================

// Étape 1 : Votre activité
export const ProspectOnboardingStep1Schema = z.object({
  companyName: z
    .string()
    .min(1, { message: "Le nom de l'entreprise est requis." })
    .max(150, { message: "150 caractères maximum." }),
  activity: z
    .string()
    .min(2, { message: "Merci d'indiquer votre activité principale." })
    .max(200, { message: "200 caractères maximum." }),
  // Email supprimé - déjà renseigné à l'inscription
  phone: z
    .string()
    .min(1, { message: "Le numéro de téléphone est obligatoire." })
    .regex(/^[0-9\s+().-]{8,30}$/, {
      message: "Indiquez un numéro valide (chiffres, +, espaces, . ou -)."
    }),
  siteGoal: z
    .array(z.enum(["present_services", "get_contacts", "sell_online", "optimize_image", "other"]))
    .min(1, { message: "Sélectionnez au moins un objectif pour votre site." }),
  siteGoalOther: z.string().max(200).optional()
});

// Étape 2 : Style & inspirations
export const ProspectOnboardingStep2Schema = z.object({
  inspirationUrls: z
    .array(z.string().url({ message: "URL invalide." }).or(z.literal("")))
    .max(3, { message: "Maximum 3 liens." })
    .optional(),
  preferredStyles: z
    .array(
      z.enum([
        "simple_minimalist",
        "modern_dynamic",
        "luxury_elegant",
        "colorful_creative",
        "professional_serious",
        "not_sure"
      ])
    )
    .min(1, { message: "Sélectionnez au moins un style ou 'Je ne sais pas'." })
});

// Étape 3 : Identité visuelle
export const ProspectOnboardingStep3Schema = z.object({
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, { message: "Couleur invalide (format hex: #RRGGBB)." })
    .optional(),
  logoUrl: z.string().url({ message: "URL invalide." }).optional().or(z.literal("")),
  hasVisualIdentity: z.enum(["yes", "no", "not_yet"], {
    errorMap: () => ({ message: "Sélectionnez une option." })
  })
});

// Étape 4 : Contenu / message
export const ProspectOnboardingStep4Schema = z.object({
  welcomePhrase: z
    .string()
    .min(5, { message: "Au moins 5 caractères." })
    .max(200, { message: "200 caractères maximum." }),
  mainServices: z
    .array(z.string().max(100))
    .length(3, { message: "Indiquez exactement 3 services principaux." })
    .superRefine((services, ctx) => {
      const first = services?.[0]?.trim() ?? "";
      if (first.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Le premier service est requis (au moins 2 caractères).",
          path: [0]
        });
      }
    }),
  importantInfo: z.string().max(1000, { message: "1000 caractères maximum." }).optional()
});

// Schéma complet pour le payload prospect (brouillon - tous optionnels)
export const ProspectOnboardingDraftSchema = z.object({
  companyName: z.string().optional(),
  activity: z.string().optional(),
  phone: z.string().optional(),
  siteGoal: z.array(z.enum(["present_services", "get_contacts", "sell_online", "optimize_image", "other"])).optional(),
  siteGoalOther: z.string().optional(),
  inspirationUrls: z.array(z.string()).optional(),
  preferredStyles: z.array(z.string()).optional(),
  primaryColor: z.string().optional(),
  logoUrl: z.string().optional(),
  hasVisualIdentity: z.enum(["yes", "no", "not_yet"]).optional(),
  welcomePhrase: z.string().optional(),
  mainServices: z.array(z.string()).optional(),
  importantInfo: z.string().optional()
});

// Schéma complet pour la validation finale prospect
export const ProspectOnboardingFinalSchema = ProspectOnboardingStep1Schema.merge(
  ProspectOnboardingStep2Schema
)
  .merge(ProspectOnboardingStep3Schema)
  .merge(ProspectOnboardingStep4Schema)
  .refine(
    (data) => {
      // Si siteGoal contient "other", siteGoalOther doit être rempli
      if (data.siteGoal?.includes("other") && (!data.siteGoalOther || data.siteGoalOther.trim().length === 0)) {
        return false;
      }
      return true;
    },
    {
      message: "Précisez votre objectif si vous avez choisi 'Autre'.",
      path: ["siteGoalOther"]
    }
  );

export type ProspectOnboardingPayload = z.infer<typeof ProspectOnboardingFinalSchema>;
export type ProspectOnboardingDraftPayload = z.infer<typeof ProspectOnboardingDraftSchema>;

export const notificationPreferencesSchema = z
  .object({
    emailNotifications: z.boolean().optional(),
    ticketUpdates: z.boolean().optional(),
    fileUpdates: z.boolean().optional(),
    billingUpdates: z.boolean().optional(),
    onboardingUpdates: z.boolean().optional(),
    marketing: z.boolean().optional()
  })
  .refine((values) => Object.keys(values).length > 0, {
    message: "Aucun changement détecté.",
    path: ["emailNotifications"]
  });

export type NotificationPreferencesPayload = z.infer<typeof notificationPreferencesSchema>;
