# CalenShare - Project Documentation

Ce document (`GEMINI.md`) sert de base de connaissances pour l'architecture, les choix techniques et la philosophie du projet **CalenShare**. Tout IA travaillant sur ce projet doit se référer à ce document avant de proposer des changements structurels.

## 1. Philosophie & UX
CalenShare est une application de calendrier partagé conçue pour un groupe restreint (famille / amis très proches).
- **Simplicité avant tout :** L'interface doit être lisible instantanément (scannable).
- **Design "Premium" & Sobre :** Pas de fioritures excessives. Utilisation de Tailwind V4 pour des interfaces modernes, souvent en Dark Mode, avec une typographie soignée et des accents colorés légers ("muted-foreground", déclinaisons subtiles de couleurs pour les avatares).
- **Pas de gestion de groupes :** Historiquement, l'application gérait des `family_groups`. Cela a été supprimé pour simplifier. Actuellement, **tous les utilisateurs inscrits partagent le même espace global**, filtré uniquement par les niveaux de confidentialité des événements et les politiques RLS (Row Level Security).

## 2. Stack Technique
- **Framework Front-end :** Next.js 16.1 (App Router, Turbopack)
- **React :** Version 19
- **Styling :** Tailwind CSS v4, `lucide-react` (icônes), `clsx` & `tailwind-merge` pour l'utilitaire `cn()`.
- **UI Components :** Basés sur Radix UI primitives (Dialog, Popover, Select, etc.).
- **Backend & Database :** Supabase (PostgreSQL, Auth, Storage, Realtime).
- **Gestion d'état métier :** React Hooks personnalisés (`useSupabaseEvents`, `useSupabaseUsers`, `useProposalsData`).

## 3. Architecture de la Base de Données (PostgreSQL / Supabase)
Le modèle de données a évolué (via des scripts de migration dans `/supabase/*.sql`).

### Tables Principales
1. **`profiles`**
   - Extension de `auth.users`.
   - Colonnes : `id`, `display_name`, `color`, `avatar_id`.
   - Créé automatiquement via un Trigger SQL à l'inscription.
2. **`events`**
   - L'entité centrale. Plus de `group_id`.
   - **`privacy`** : 
     - `'prive'` : Visible uniquement par le créateur. Côté calendrier commun, apparaît comme un bloc "Occupé" anonyme.
     - `'public'` : Visible par tous (Titre, date, heure), mais sans description détaillée.
     - `'public_details'` : Entièrement visible par tous.
   - **`status`** : 
     - `'proposed'` : Événement en cours de vote dans l'onglet "Événements".
     - `'confirmed'` : Événement acté, affiché normalement dans le calendrier.
3. **`event_responses`**
   - Stocke les votes des utilisateurs pour les événements au statut `'proposed'`.
   - Valeurs de `status` : `'available'` (Présent), `'unavailable'` (Pas là).
4. **`event_comments`**
   - Fil de discussion lié à un événement spécifique.
5. **`event_attachments`**
   - Métadonnées des fichiers stockés dans le bucket Storage Supabase (`event-attachments`).
6. **`user_availability`**
   - Table séparée des événements, permettant à un utilisateur d'indiquer de façon abstraite "Je suis dispo" ou "Je suis occupé" sur des dates précises, pour faciliter la planification.

### Sécurité (RLS)
- Supabase RLS est activé sur toutes les tables.
- **Principe de base :** L'application est un "bac à sable" global pour les utilisateurs authentifiés. 
- Les objets (events, reponses, comments) sont globalement en `SELECT` pour les utilisateurs authentifiés (sauf restriction `privacy` sur les events).
- Les opérations `INSERT`, `UPDATE`, `DELETE` sont **strictement réservées au créateur** (`user_id = auth.uid()`).
- Un script de reset complet des RLS Events se trouve dans `supabase/08_reset_events_rls.sql` pour garantir l'absence de politiques conflictuelles (bug fréquent résolu récemment).

## 4. Fonctionnalités Clés & Logique Front-end

### A. Mon Calendrier (`/mon-calendrier`)
- Vue personnelle de l'utilisateur.
- Affiche **tous** ses propres événements (privés comme publics).
- Affiche les événements des autres **uniquement si l'utilisateur a voté "Présent"** (pour les propositions) ou si cet événement le concerne directement.
- Les nouveaux événements créés depuis cette vue sont par défaut en statut `'proposed'` pour passer par le flux de validation du groupe.

### B. Calendrier Commun (`/calendrier-commun`)
- Vue d'agrégation de tout le groupe.
- Affiche les disponibilités des utilisateurs (`user_availability`).
- Affiche les événements confirmés ou les événements "proposed" ayant **au moins 2 votes "Présent"**.
- Respecte le flag `privacy` de chaque événement pour masquer les détails si nécessaire (rendu visuel de hachurage ou bloc plein).

### C. Événements (Propositions & Votes) (`/evenements`)
- Interface de type "Kanban" à deux colonnes :
  - **À voter :** Événements `proposed` avec moins de 2 votes "Présent".
  - **C'est noté :** Événements `confirmed` OU `proposed` ayant atteint 2 votes "Présent".
- Les utilisateurs votent via les boutons "Présent" / "Pas là" (visibles sur toutes les cartes pour des modifications rapides).
- La modale de détail ne permet de voter que si l'événement n'est pas encore "confirmé" (statut visuel, prop `isConfirmed`).

### D. Messagerie (`/messagerie`)
- Anciennement par groupe, aujourd'hui c'est un chat global unique, puisque tous les utilisateurs font partie de la même instance "famille/amis".

### E. Realtime
Le hook `useSupabaseEvents.ts` utilise les `channels` PostgreSQL de Supabase pour écouter les mutations sur la table `events`. Chaque modification (ajout, édition, suppression) déclenche un "refetch" local, garantissant une UI toujours synchronisée entre les membres sans "F5" nécessaire.

## 5. Directives de Développement
- Toujours vérifier dans `supabase/*.sql` l'état de la structure de données avant de modifier les requêtes Supabase (`src/lib/supabase/queries.ts`).
- **Composants d'UI :** Réutiliser prioritairement les sous-dossiers `/components/ui/` (Shadcn/Tailwind).
- **Styling :** Remplacer les dégradés et couleurs "dures" par des couleurs sémantiques Tailwind autant que possible (ex: `text-muted-foreground` pour les pseudonymes) pour maintenir le design sobre et scannable.
- En cas de modification des suppressions (ex: `deleteEvent`), s'assurer que l'opération RLS (`{ count: "exact" }`) est gérée pour retourner le succès/échec à l'interface, afin d'éviter la désynchronisation optimiste.
