# Notes de déploiement — Railway & Netlify

## Contexte
Ce projet est déployé en simultané sur **Railway** (production principale) et **Netlify** (déploiement secondaire). Le code source est sur GitHub et les deux plateformes se déclenchent automatiquement à chaque `git push`.

---

## Problème 1 : `npm ci` plante sur Railway — `EBADPLATFORM` Android

### Cause
`netlify-cli` (dépendance de développement) télécharge des binaires de compilation **Rollup** pour *toutes* les plateformes : Mac, Windows, Linux et **Android**.

Quand Railway tente d'installer les dépendances via `npm ci` (mode strict), il tombe sur le binaire `@rollup/rollup-android-arm-eabi` qui est destiné à Android ARM, incompatible avec le serveur Linux x64 de Railway. En mode strict, `npm ci` refuse d'aller plus loin et plante.

```
npm error code EBADPLATFORM
npm error notsup Unsupported platform for @rollup/rollup-android-arm-eabi@4.52.2:
npm error notsup   wanted  {"os":"android","cpu":"arm"}
npm error notsup   current {"os":"linux", "cpu":"x64"}
```

### Mauvaises pistes testées
- Modifier la commande de build dans `railway.json` → ignoré car Railpack écrase la config
- Passer la commande `npm install` dans le script `build` du `package.json` → contournement fragile
- Ajouter un `override` sur `rollup` dans `package.json` → aggrave le problème en cassant la cohérence du `package-lock.json`
- Supprimer `netlify-cli` → ça marche pour Railway mais casse le setup Netlify (inacceptable)

### Résolution ✅
Déclarer tous les binaires spécifiques aux plateformes en tant que **`optionalDependencies`** dans `package.json`.  
Quand `npm ci` voit un paquet marqué comme "optionnel" incompatible avec le système actuel, il l'**ignore silencieusement** au lieu de planter.

```json
"optionalDependencies": {
  "@rollup/rollup-android-arm-eabi": "^4.59.0",
  "@rollup/rollup-android-arm64": "^4.59.0",
  "@rollup/rollup-darwin-arm64": "^4.59.0",
  "@rollup/rollup-darwin-x64": "^4.59.0",
  "@rollup/rollup-linux-arm-gnueabihf": "^4.59.0",
  "@rollup/rollup-linux-arm64-gnu": "^4.59.0",
  "@rollup/rollup-linux-x64-gnu": "^4.59.0",
  "@rollup/rollup-linux-x64-musl": "^4.59.0",
  "@rollup/rollup-win32-x64-msvc": "^4.59.0"
}
```

---

## Problème 2 : `npm ci` plante — `package.json` et `package-lock.json` désynchronisés

### Cause
À chaque édition manuelle du `package.json` (ex : ajout via `npm pkg set`, suppression de champs), le `package-lock.json` n'est pas automatiquement mis à jour. `npm ci` exige une cohérence parfaite entre les deux fichiers et refuse d'installer si une dépendance mentionnée dans l'un manque dans l'autre.

```
npm error code EUSAGE
npm error `npm ci` can only install packages when your package.json and package-lock.json are in sync.
npm error Missing: @rollup/rollup-android-arm-eabi@4.52.2 from lock file
```

### Résolution ✅
Après toute modification du `package.json`, toujours régénérer le lock file :

```bash
rm -rf node_modules package-lock.json
npm install
git add package.json package-lock.json
git commit -m "Sync lockfile"
git push
```

---

## Architecture de déploiement finale

| Plateforme | Déclencheur       | Commande d'install | Commande de build  | Commande de démarrage              |
|------------|-------------------|--------------------|--------------------|------------------------------------|
| Railway    | Push sur `main`   | `npm ci`           | `npm run build`    | `npm run start` (`$PORT` injecté)  |
| Netlify    | Push sur `main`   | `npm install`      | `npm run build`    | Géré par Netlify                   |

### Note sur le port
Le script `"start": "next start -p ${PORT:-3000}"` est **correct**.
- En local : Next.js écoute sur le port 3000 (fallback)
- Sur Railway : la variable d'environnement `$PORT` est injectée automatiquement (ex : 8089)

---

## Checklist post-déploiement

- [x] Application démarrée sur Railway (`le-mazet-production.up.railway.app`)
- [ ] Variable `NEXT_PUBLIC_APP_URL` = URL Railway dans le dashboard Railway
- [ ] Variables `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurées dans Railway
- [ ] URL Railway ajoutée dans les "Redirect URLs" de Supabase (Authentication > URL Configuration)
- [ ] Test de connexion et de navigation sur l'URL de production
