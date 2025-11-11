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
  fullName: z
    .string({ required_error: "Le nom complet est requis." })
    .min(2, { message: "Le nom doit contenir au moins 2 caractères." })
    .max(120, { message: "Le nom dépasse 120 caractères." }),
  company: z
    .string({ required_error: "Merci d’indiquer votre entreprise." })
    .min(2, { message: "Merci d’indiquer un nom d’entreprise valide." })
    .max(150, { message: "La raison sociale dépasse 150 caractères." }),
  phone: z
    .string({ required_error: "Merci d’indiquer un numéro de téléphone." })
    .regex(/^[0-9\s+().-]{8,30}$/, {
      message: "Indiquez un numéro valide (chiffres, +, espaces, . ou -)."
    }),
  website: emptyToUndefined(z.string().url({ message: "Merci de fournir une URL valide." }))
});

const goalOptions = ["visibilite", "leads", "ecommerce", "autre"] as const;

export const OnboardingStep2Schema = z.object({
  goals: z
    .array(z.string())
    .min(1, { message: "Sélectionnez au moins un objectif." })
    .max(5, { message: "Merci de limiter à 5 objectifs." }),
  primaryGoal: z.enum(goalOptions, {
    required_error: "Merci de sélectionner l’objectif prioritaire."
  }),
  description: emptyToUndefined(
    z
      .string()
      .max(2000, { message: "Merci de rester sous 2000 caractères." })
  )
});

export const OnboardingStep3Schema = z.object({
  pages: z
    .array(z.string())
    .min(1, { message: "Sélectionnez au moins une page." })
    .max(10, { message: "Merci de limiter à 10 pages principales." }),
  contentsNote: emptyToUndefined(
    z
      .string()
      .max(2000, { message: "Merci de rester sous 2000 caractères." })
  )
});

export const OnboardingStep4Schema = z.object({
  inspirations: z
    .array(z.string().url({ message: "Merci d’indiquer une URL valide." }))
    .min(1, { message: "Fournissez au moins une source d’inspiration." })
    .max(8, { message: "8 inspirations maximum." }),
  competitors: z
    .array(z.string().url({ message: "Merci d’indiquer une URL valide." }))
    .max(8, { message: "8 concurrents maximum." })
    .optional()
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

export const OnboardingPayloadSchema = OnboardingPayloadFields.superRefine((data, ctx) => {
  if (data.domainOwned && !data.domainName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Merci de préciser le nom de domaine.",
      path: ["domainName"]
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
});

export const ticketCreateSchema = z.object({
  projectId: z.string().uuid({ message: "Projet invalide." }),
  title: z
    .string()
    .min(4, { message: "Le titre doit contenir au moins 4 caractères." })
    .max(120, { message: "Le titre est trop long." }),
  description: z
    .string()
    .min(12, { message: "Décrivez votre demande en quelques lignes." })
    .max(4000, { message: "Merci de rester synthétique (4000 caractères max)." })
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
    status: z.enum(["open", "in_progress", "done"]).optional()
  })
  .refine(
    (value) => Boolean(value.title ?? value.description ?? value.status),
    {
      message: "Aucun changement détecté.",
      path: ["status"]
    }
  );

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
    .max(128, { message: "Le mot de passe est trop long." })
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
    .optional(),
  dueDate: z
    .string()
    .datetime({ message: "La date doit être une ISO valide." })
    .optional()
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
