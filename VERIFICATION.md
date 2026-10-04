# Vérification locale du 4 octobre 2026

Base : `deba8200dfb1284b9d58e65070a91ae5bda1f5fd`. Branche préparatoire : `prepare/portfolio-documentation`.

Environnement : macOS, Node `v26.7.0` ; le projet demande Node `22.x`. Installation `npm ci --ignore-scripts` déjà réalisée lors de la préparation : 1616 paquets, 77 vulnérabilités rapportées (6 critiques, 50 élevées, 19 modérées, 2 faibles). Ces résultats ne garantissent pas une installation ou une exécution sous Node 22.

| Commande | Résultat |
| --- | --- |
| `node --test tests/event-reactions.test.cjs` avant correction | 4 échecs, exports `getEventReactions`, `addEventReaction`, `deleteEventReaction` absents |
| Même commande après correction | 4 tests réussis, 0 échec |
| `npx tsc --noEmit` | Code de sortie 0 |
| `git diff --check` | Code de sortie 0 |
| `npx eslint src/lib/supabase/queries.ts tests/event-reactions.test.cjs` | Code 2, crash de l'outillage : `TypeError: Cannot set properties of undefined (setting 'defaultMeta')`, avec avertissement AJV `option missingRefs` |
| `npm run build` | Aucun succès établi ; première tentative interrompue après plusieurs minutes silencieuses, diagnostic Next à l'étape `compile`. Nouvelle tentative directe bornée à 60 s : `Creating an optimized production build ...`, puis `BUILD_TIMEOUT_60S`, sortie 143 (SIGTERM) |
| `npm run build -- --webpack` sans configuration | Compilation réussie en 7,2s puis échec de collecte de `/evenements` : trois variables publiques absentes |
| Même commande avec configuration synthétique | Code 0, compilation 4,4s, TypeScript et génération statique 12/12 ; configuration fictive, aucun serveur Supabase |
| Écran `/connexion` dans Chromium | Captures 1440×1000 et390×844, document390px/viewport390px ; aucun formulaire soumis, aucune erreur applicative, remarque autocomplete seulement |

Le test compile en mémoire le vrai fichier TypeScript avec TypeScript déjà installé et utilise un client synthétique, sans dépendance de test ajoutée. Il vérifie les champs de lecture, l'ordre chronologique, le mapping, le payload d'insertion, les trois filtres de suppression, la suppression sans ligne et les erreurs. Les données du test sont des identifiants fictifs explicitement synthétiques.

Le code de suppression utilise un compte exact et renvoie `false` si aucune ligne n'est supprimée, comme les autres requêtes de ce dépôt. L'insertion reste une insertion simple : la contrainte SQL unique et la RLS de la migration 18 continuent de décider côté base. Aucune politique n'est remplacée par le client.

## Non validé

Aucun accès Supabase ni script SQL exécuté. Auth, RLS, RPC, Storage, Realtime, notifications et parcours multiutilisateurs non validés. Pas de capture, pas de déploiement, pas de preuve de fonctionnement complet. La police Inter utilise `next/font/google` ; le build peut nécessiter un accès réseau, mais la cause de la compilation inachevée n'est pas établie.

Mise à jour du diagnostic : webpack aboutit après configuration, sans modification du code. Le défaut Turbopack reste non expliqué. Les captures ajoutées montrent uniquement l’écran public original, pas un calendrier rempli. Les variables de l’essai ont été définies seulement pour les commandes : `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:65530`, `NEXT_PUBLIC_SUPABASE_ANON_KEY=synthetic-build-only-no-credentials`, `NEXT_PUBLIC_APP_URL=http://127.0.0.1:4188`. Le port65530 a été contrôlé sans serveur à l’écoute. Aucun fichier d’environnement privé n’a été lu ni créé. Aucune instance Supabase réelle n’a été contactée. Le serveur local lié à127.0.0.1 utilise ces mêmes valeurs fictives. Dépréciation Node module.register observée pendant build.

Les fichiers SQL historiques comprennent des changements et réinitialisations de politiques ; l'ordre de reconstruction sur une base vide reste à valider. Le code conserve plusieurs noms et métadonnées CalenShare d'origine, malgré le nom de dépôt Le Mazet. Les mentions de confidentialité existantes dans l'interface ne constituent pas une certification de sécurité.

## Sources et confidentialité

La préparation contient uniquement une correction de requêtes, son test, cette notice, le README et un exemple d'environnement vide. Aucun fichier d'environnement existant lu ni copié. `.env.local`, caches, dépendances et fichiers de build restent ignorés ; seule `.env.example` est réincluse. Aucun téléchargement de données personnelles ni publication des sources privées.
