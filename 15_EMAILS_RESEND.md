# 15 · Emails avec Resend

## Configuration

### Variables d'environnement requises

Dans Vercel, ajoutez ces variables :

- `RESEND_API_KEY` : Votre clé API Resend (obtenue depuis [resend.com](https://resend.com))
- `EMAIL_FROM` : L'adresse email d'envoi validée (ex: `noreply@orylis.fr`)
- `NEXTAUTH_URL` : L'URL de votre application (ex: `https://app.orylis.fr`)

### Obtenir la clé API Resend

1. Créez un compte sur [resend.com](https://resend.com)
2. Allez dans **API Keys**
3. Créez une nouvelle clé API
4. Copiez la clé et ajoutez-la dans Vercel comme `RESEND_API_KEY`

### Valider un domaine (recommandé)

Pour améliorer la délivrabilité :

1. Dans Resend, allez dans **Domains**
2. Ajoutez votre domaine (ex: `orylis.fr`)
3. Configurez les enregistrements DNS (DKIM, SPF) comme indiqué
4. Une fois validé, utilisez `noreply@orylis.fr` comme `EMAIL_FROM`

## Architecture

### Service centralisé : `lib/emails.ts`

Tous les emails sont gérés par le service `lib/emails.ts` qui fournit :

- ✅ Templates HTML professionnels et responsive
- ✅ Gestion automatique des erreurs
- ✅ Récupération des informations utilisateur
- ✅ Support de Resend avec fallback si non configuré

### Fonctions disponibles

```typescript
// Email de bienvenue
await sendWelcomeEmail(userId, projectName?)

// Nouveau ticket créé
await sendTicketCreatedEmail(ticketId, ticketTitle, projectName, authorName, recipientUserId)

// Réponse sur un ticket
await sendTicketReplyEmail(ticketId, ticketTitle, projectName, authorName, recipientUserId)

// Ticket mis à jour
await sendTicketUpdatedEmail(ticketId, ticketTitle, projectName, status, recipientUserId)

// Fichier uploadé
await sendFileUploadedEmail(fileName, projectName, uploaderName, recipientUserId)

// Onboarding complété
await sendOnboardingCompletedEmail(projectId, projectName, recipientUserId)

// Projet mis à jour
await sendProjectUpdatedEmail(projectId, projectName, updateMessage, recipientUserId)
```

## Intégration dans les actions

### Exemple : Envoyer un email lors de la création d'un ticket

Dans `app/api/tickets/route.ts` :

```typescript
import { sendTicketCreatedEmail } from "@/lib/emails";
import { notifyProjectParticipants } from "@/lib/notifications";

// Après la création du ticket
const [created] = await db.insert(tickets).values({...}).returning({...});

// Notifier dans l'app (notification in-app)
await notifyProjectParticipants({
  projectId,
  excludeUserIds: [session.user.id],
  includeStaff: true,
  includeOwner: false,
  type: "ticket_created",
  title: "Nouveau ticket créé",
  body: `${creatorName} a créé un ticket : ${title}`,
  metadata: { ticketId: created.id }
});

// Envoyer un email au staff (en arrière-plan, ne bloque pas)
if (!staff) {
  const staffProfiles = await db.query.profiles.findMany({
    where: (p, { eq }) => eq(p.role, "staff"),
    columns: { id: true }
  });
  
  // Envoyer un email à chaque membre du staff
  for (const staff of staffProfiles) {
    sendTicketCreatedEmail(
      created.id,
      title,
      project.name,
      creatorName,
      staff.id
    ).catch(error => {
      console.error("[Email] Failed to send ticket created email:", error);
    });
  }
}
```

### Exemple : Email lors d'une réponse sur un ticket

Dans `app/api/tickets/[id]/route.ts` (POST) :

```typescript
import { sendTicketReplyEmail } from "@/lib/emails";

// Après l'insertion du message
const [message] = await db.insert(ticketMessages).values({...}).returning({...});

// Récupérer l'auteur du ticket (pour lui envoyer l'email)
const ticketAuthor = await db.query.tickets.findFirst({
  where: eq(tickets.id, id),
  columns: { authorId: true }
});

// Si l'auteur du ticket n'est pas celui qui répond, lui envoyer un email
if (ticketAuthor?.authorId && ticketAuthor.authorId !== session.user.id) {
  sendTicketReplyEmail(
    id,
    ticket.title,
    ticket.projectName,
    session.user.name ?? session.user.email ?? "Un membre",
    ticketAuthor.authorId
  ).catch(error => {
    console.error("[Email] Failed to send ticket reply email:", error);
  });
}
```

## Personnalisation des templates

### Modifier le contenu d'un email

Les templates sont dans `lib/emails.ts`. Vous pouvez :

1. **Modifier directement le HTML** dans chaque fonction (ex: `sendTicketCreatedEmail`)
2. **Changer le template de base** dans la fonction `getEmailTemplate()`
3. **Ajouter des variables personnalisées** selon vos besoins

### Exemple : Personnaliser l'email de bienvenue

```typescript
export async function sendWelcomeEmail(userId: string, projectName?: string) {
  // ... récupération des infos utilisateur ...
  
  const content = `
    <h2 style="color: #1a202c; margin-top: 0;">Bonjour ${userName} 👋</h2>
    <p>Bienvenue sur votre espace client Orylis !</p>
    ${projectName ? `<p>Votre projet <strong>${projectName}</strong> a été créé.</p>` : ""}
    <!-- Ajoutez votre contenu personnalisé ici -->
    <p>Nous sommes ravis de vous accompagner dans la création de votre site web.</p>
  `;

  return sendEmail({
    to: user.email,
    subject: "Bienvenue sur Orylis Hub",
    html: getEmailTemplate(content, "Accéder à mon espace", `${appUrl}/login`)
  });
}
```

## Actions à intégrer

Voici les actions qui devraient déclencher des emails :

### ✅ Déjà implémenté
- Email de bienvenue (partiellement dans `app/api/admin/clients/route.ts`)

### 🔄 À intégrer

1. **Création de ticket** (`app/api/tickets/route.ts`)
   - Email au staff quand un client crée un ticket

2. **Réponse sur ticket** (`app/api/tickets/[id]/route.ts` POST)
   - Email à l'auteur du ticket quand quelqu'un répond

3. **Mise à jour de ticket** (`app/api/tickets/[id]/route.ts` PATCH)
   - Email aux participants quand le statut change

4. **Upload de fichier** (`app/api/files/route.ts`)
   - Email au staff quand un client upload un fichier

5. **Onboarding complété** (`app/api/onboarding/route.ts`)
   - Email au staff quand un client complète l'onboarding

6. **Mise à jour de projet** (`app/api/projects/[id]/route.ts`)
   - Email au client quand le staff met à jour le projet (statut, progression)

## Bonnes pratiques

### 1. Ne pas bloquer sur les emails

Toujours envoyer les emails en arrière-plan :

```typescript
// ❌ Ne pas faire ça (bloque la requête)
await sendTicketCreatedEmail(...);

// ✅ Faire ça (non-bloquant)
sendTicketCreatedEmail(...).catch(error => {
  console.error("[Email] Failed:", error);
});
```

### 2. Gérer les erreurs silencieusement

Les emails ne doivent jamais faire échouer une action principale :

```typescript
try {
  // Action principale (création de ticket, etc.)
  await db.insert(tickets).values({...});
  
  // Email en arrière-plan
  sendTicketCreatedEmail(...).catch(console.error);
} catch (error) {
  // L'erreur ne doit concerner que l'action principale
}
```

### 3. Respecter les préférences utilisateur

Vous pouvez vérifier les préférences email dans `notificationPreferences` :

```typescript
const preferences = await db.query.notificationPreferences.findFirst({
  where: eq(notificationPreferences.userId, userId)
});

if (preferences?.emailNotifications) {
  await sendEmail(...);
}
```

## Test en développement

En développement (sans `RESEND_API_KEY`), les emails sont loggés dans la console :

```
[Email] RESEND_API_KEY not configured, email not sent: Nouveau ticket : ...
```

Pour tester réellement, ajoutez `RESEND_API_KEY` dans votre `.env.local`.

## Prochaines améliorations possibles

- [ ] Queue d'emails (BullMQ, Inngest) pour gérer les envois en masse
- [ ] Templates React Email pour un meilleur DX
- [ ] Interface admin pour modifier les templates
- [ ] Logs d'envoi d'emails dans la base de données
- [ ] Statistiques d'ouverture (via Resend webhooks)

