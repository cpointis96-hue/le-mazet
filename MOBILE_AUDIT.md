# Audit Mobile-First — CalenShare

## L'image de référence : quel style est-ce ?

Le design de l'image ressemble au kit **Untitled UI** (ou équivalent Linear/Notion-style). Ses caractéristiques :
- **Dark mode** prononcé, arrière-plan très sombre (`#0A0A0A`/`#111`)
- Sidebar **compacte** avec icônes + labels courts, sections regroupées
- Contenu principal **épuré** avec headers en typographie forte
- Calendrier en vue **semaine** (colonnes fines), dots colorés pour les événements
- **Pas de surabondance** : chaque info en un seul endroit, jamais deux fois
- Actions principales bien visibles (bouton "Add event" en haut à droite)
- Onglets de filtre sobres (`All events / Shared / Public / Archived`)

---

## Audit de chaque page

### 1. `/mon-calendrier` — Mon Calendrier
**Fonctionnalités :**
- Vue mensuelle (grille 7 colonnes) avec navigation Mois/Année
- Clic sur un jour → formulaire de création d'événement (Dialog)
- Clic sur un événement → fiche de détail puis édition/suppression
- Indicateurs de disponibilité personnelle (vert/rouge sur les jours)
- Toggle disponibilité par jour (cliquable directement sur le jour)

**⚠️ Problème Mobile First :**
> La grille mensuelle est quasi-inutilisable sur écran < 400px. Trop d'informations compressées.

**✅ Adaptation recommandée :**
- Mobile : **Vue "Agenda"** (liste verticale des prochains événements)
- Switcher en haut avec 3 onglets : `Agenda | Mois | Année`
- Sur mobile, le clic sur un jour navigue vers une **page dédiée** (pas une modal trop grande)

---

### 2. `/calendrier-commun` — Calendrier Commun
**Fonctionnalités :**
- Même grille mensuelle, mais pour tout le groupe
- Affichage des disponibilités de tous les membres (couleurs par utilisateur)
- Affichage des événements confirmés + propositions avec 2+ votes
- Sidebar complémentaire : légende des membres (couleurs)
- Événements privés masqués (bloc "Occupé" anonyme)

**⚠️ Problème Mobile First :**
> La légende des membres dans la sidebar disparaît en mobile, et la grille comprend les infos de 4-5 personnes différentes en même temps.

**✅ Adaptation recommandée :**
- Mobile : une ligne en haut avec les **avatars des membres** (cliquables pour filtrer)
- Vue par défaut en **liste ou semaine condensée**, pas le mois entier
- La légende devient une **bottom sheet** accessible via un bouton

---

### 3. `/evenements` — Événements (Kanban propositions)
**Fonctionnalités :**
- Deux colonnes Kanban : "À voter" / "C'est noté"
- Cartes avec : titre, date, créateur, description, votes présents/absents
- Boutons de vote rapide (Présent / Pas là) directement sur la carte
- Bouton rapide "Un verre ce soir ?" (création en 1 clic)
- Bouton "Lancer une idée" → formulaire complet
- Support des sondages multi-dates avec deadline de réponse
- Modal de détail : description, DateProposals, commentaires, checklist

**✅ Bonne nouvelle : c'est la page qui s'adapte le mieux au mobile !**
- Sur mobile, les 2 colonnes deviennent **2 onglets** ("À voter" / "C'est noté")
- Les cartes sont naturellement verticales et scrollables
- Les boutons de vote sont déjà compacts et tactiles

---

### 4. `/messagerie` — Chat groupe
**Fonctionnalités :**
- Chat global unique (tous les membres)
- Bulles de messages (style iMessage : moi à droite, autres à gauche)
- Avatars et noms
- Regroupement des messages consécutifs du même auteur
- Séparateurs de date
- Input texte + bouton Envoyer (rond)
- Scroll automatique vers le dernier message

**✅ PARFAITE pour mobile** — déjà pensée comme une app de messagerie native. Quasi rien à changer.

---

### 5. `/profil` — Profil utilisateur
**Fonctionnalités :**
- Section 1 : Nom d'affichage, couleur, avatar
- Section 2 : Changement d'email (avec confirmation)
- Section 3 : Changement de mot de passe (avec vérification de l'ancien)

**✅ Naturellement mobile-friendly** — c'est un formulaire vertical, ça fonctionne déjà bien sur petit écran.

---

## Navigation actuelle vs. Navigation Mobile-First idéale

### Actuel : Sidebar laterale
```
[CalenShare Logo]
- Mon Calendrier
- Calendrier Commun
- Événements
- Messagerie
—————————
- Profil
- Paramètres
- Se déconnecter
```
> ❌ La sidebar disparaît sur mobile (burger menu) → navigation cachée, mauvaise UX

### Proposé : **Bottom Navigation Bar** (style iOS/Android)
```
┌────────────────────────────────────────┐
│         Contenu de la page             │
│                                        │
│                                        │
│                                        │
└────────────────────────────────────────┘
┌──────┬──────┬──────┬──────┬──────┐
│  📅   │ 👥   │ 🎫   │ 💬   │ 👤   │
│Monc.  │Commun│Events│Chat  │Profil│
└──────┴──────┴──────┴──────┴──────┘
```
> ✅ Standard UX mobile. Toujours visible. Navigation en 1 tap.

Sur **desktop** → la Sidebar actuelle est conservée (elle est déjà très propre).

---

## Résumé : Transposable au style Untitled UI ?

| Page | Effort | Note |
|---|---|---|
| Messagerie | ⭐ Très faible | Déjà quasi-parfaite |
| Événements | ⭐⭐ Faible | Transformer les 2 colonnes en onglets |
| Profil | ⭐ Très faible | Déjà vertical et compact |
| Calendrier Commun | ⭐⭐⭐ Moyen | Changer la vue par défaut + légende |
| Mon Calendrier | ⭐⭐⭐⭐ Important | Ajouter vue Agenda mobile |

**Le plus gros chantier** : remplacer la grille mensuelle par une vue "Agenda" sur mobile et implémenter une Bottom Navigation Bar qui remplace la sidebar.

**Bonne nouvelle** : tout le reste (composants, couleurs, typographie Tailwind) est déjà sobre et adapté au dark mode. Le "look" Untitled UI est déjà à 70% là.
