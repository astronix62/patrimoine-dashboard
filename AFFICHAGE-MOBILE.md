# Affichage mobile / iPhone — analyse et corrections

Document de synthèse du travail réalisé sur `index.html`.
Aucun écran n'a été redessiné : uniquement les défauts d'affichage constatés
sur iPhone ont été corrigés, plus quelques optimisations d'ergonomie ciblées.

---

## 1. Analyse — dimensions prises en compte

| Appareil | Logique de mise en page de l'app | Zone à problèmes |
|---|---|---|
| iPhone SE / 8 | 375 × 667 (`is-mobile` + `is-tiny`) | Dynamic Island absente, barre d'accueil présente |
| iPhone X / XS / 11 Pro / 12 mini | 375 × 812 (`is-tiny`) | encoche haute |
| **iPhone 12 / 13 / 14** | **390 × 844 (`is-mobile`)** | **encoche + barre d'accueil** |
| iPhone 12 → 15 Pro | 393 × 852 (`is-mobile`) | Dynamic Island |
| iPhone 14/15 Pro Max | 430 × 932 (`is-mobile`) | Dynamic Island |
| iPhone 12 **en paysage** | 844 × 390 (`is-tablet`) | encoche latérale + écran très bas |
| iPad mini | 744 × 1133 (`is-mobile` ≤768, `is-tablet` au-delà) | — |

Points clés du passage « navigateur » → « écran d'accueil » (mode PWA) :

- en mode onglet Safari, `env(safe-area-inset-*)` vaut **0** (la barre d'état
  est hors page) : rien à corriger ;
- en mode écran d'accueil (`viewport-fit=cover`), la zone haute vaut
  **47 px** (Dynamic Island) ou 44/48 px (encoche) et la zone basse **34 px**.
  C'est dans ce mode que l'application était amputée.

---

## 2. Défauts d'affichage trouvés (mesurés, pas supposés)

### Zones sûres (Dynamic Island / encoche / barre d'accueil)

1. **Header sous la Dynamic Island** — le header est `position: sticky; top: 0`
   et ne réservait pas `safe-area-inset-top` : au moindre défilement, le logo
   **PATRIMOINE** et le bouton ☰ passaient **derrière** la Dynamic Island.
   → hauteur + padding haut corrigés (idem en mode tablette / paysage).
2. **Menu latéral mal positionné** — la sidebar mobile était calée sur `top: 52px`
   et `100dvh - 52px` en dur : décalée de 47 px et sa dernière entrée
   (Paramètres) tombait sous la barre d'accueil.
3. **Fenêtres modales sous le clavier** — les boutons *Annuler / Valider*
   passaient sous le clavier virtuel iOS.
4. **Toasts** sous la barre d'accueil.
5. **Auth-modal (Connexion)** — son contenu démarrait tout en haut de l'écran,
   donc sous la Dynamic Island en PWA.
6. **Barre « Connexion / Inscription »** — le calcul `max(8px, env(...))`
   écrasait les marges latérales.

### Débordements et éléments hors écran

7. **Modale « Importer CSV » coupée** — largeur `min-width: 460px` supérieure à
   l'écran (390 px) : **35 px perdus de chaque côté**, champs et boutons
   tronqués.
8. **Header en paysage (768–1024 px)** — les 7 onglets + la date + le bouton ☰
   ne tenaient pas : le header débordait de **~150 px** et le bouton ☰ était
   **hors de l'écran** → impossible d'ouvrir le menu sur iPhone 12 en paysage.
9. **Modales inutilisables en paysage** — écran de 390 px de haut contre
   `max-height: 85vh` : le centrage vertical rendait le **haut inaccessible** et
   les boutons d'action sortaient en bas.
10. **Tableau des transactions** — `min-width: 480px` : les colonnes
    *Montant* et *Actions* (donc les boutons ✏️ / 🗑️) étaient hors écran,
    à atteindre par défilement horizontal.

### Libellés et proportions

11. **« Échéance : undefined »** sur les cartes d'objectifs — la date était
    lue dans le mauvais champ (`o.date` alors que la donnée est `o.target_date`),
    et un objectif sans date affichait littéralement `undefined`.
12. **Proportions inégales des cartes KPI** (votre remarque) — mesuré :
    rangée 1 = **172 px** / rangée 2 = **149 px** de haut, car seule la 1re
    rangée possède la ligne « vs mois dernier ». Les courbes commençaient à
    deux hauteurs différentes. → `grid-auto-rows: 1fr` + courbe plaquée en bas
    de carte : les 4 cartes font désormais **exactement 166 px**.
13. **Axe des mois muet sur les graphiques** — les libellés longs
    (« septembre 2025 ») empêchaient Chart.js d'en afficher un seul :
    sur iPhone l'axe X était **vide** sur 5 graphiques.
14. **Espace perdu sur les iPhone de 375 px** — la vue d'ensemble passait en
    **1 seule colonne** : 4 cartes empilées = 1 000 px de défilement avant le
    premier graphique. → **2 colonnes conservées** : page raccourcie de
    **3 271 px à 2 701 px (-17 %)**, une colonne seulement sous 340 px.

### Boutons inaccessibles au doigt

15. **Crayons d'édition invisibles** — `.edit-btn` / `.edit-btn-panel` sont en
    `opacity: 0` et n'apparaissent qu'au `:hover` : **il n'y a pas de survol
    sur un écran tactile**, ces boutons étaient donc indécouvrables.
16. **Zones tactiles trop petites** — boutons ✏️/🗑️ **24 px**, interrupteurs
    **38 × 20 px**, liens « Voir le détail » **15 px** de haut,
    cases à cocher **13 px**, listes de filtre **29 px**
    (recommandation Apple : 44 px).

### Cohérence visuelle et code

17. **`var(--tx2)` inexistant** — la règle `.ntab` était donc cassée
    (variable jamais définie ; `--text2` attendu).
18. **Classe CSS fantôme `undefined`** — `class="tx-amount undefined"` sur les
    transactions : la classe attendue (`income` / `expense`) n'était jamais
    appliquée, donc **plus de vert/rouge** sur les montants.
19. **Balisage déséquilibré** — `<div class="app">` n'était **jamais fermé**
    (le navigateur le déduisait seul) ; le fichier n'était plus valide après
    ce point.
20. **6 sélecteurs en double** (`.content`, `.expense-comment*`,
    `html.is-mobile .sidebar`) et **`min-width: 480px` sur tous les tableaux**
    (y compris ceux de 4-6 colonnes qui tiennent à l'écran).
21. **Caractères non ASCII ambigus** — le signe `＋` (pleine chasse) dans les
    listes de types/catégories, plus une ligne de commentaire elle aussi en
    pleine chasse (illisible à l'édition). Balayage complet : aucun caractère
    invisible, aucun `U+FFFD`, aucune balise orpheline.

---

## 3. Corrections apportées

### Zones sûres — centralisées
Nouvelles variables dans `:root`, une seule source de vérité :

```css
--safe-top: env(safe-area-inset-top, 0px);
--safe-bottom: env(safe-area-inset-bottom, 0px);
--safe-left / --safe-right
--kb-offset: 0px;   /* hauteur du clavier, mesurée en JS */
```

- header, sidebar, backdrop, barre d'auth, menu, toasts, contenu principal et
  modales réservent désormais ces zones ;
- un écouteur `visualViewport` publie la hauteur du clavier dans `--kb-offset` :
  **la fenêtre remonte au-dessus du clavier** (0 px quand le clavier est fermé) ;
- `interactive-widget=resizes-content` + `format-detection=telephone=no`
  ajoutés à la balise `viewport`.

### Fenêtres « feuille » plus pratiques à utiliser
- barre **Annuler / Valider collée en bas** de la fenêtre
  (`position: sticky`) : elle reste visible même quand le formulaire est plus
  haut que l'écran ou quand le clavier est ouvert ;
- **titre collé en haut** ;
- **poignée visuelle** en haut de la feuille (indique que ça s'ouvre par le
  bas) ;
- hauteur bornée par `90dvh` au lieu de `90vh` (la barre d'adresse de Safari
  réduit la hauteur réelle) ;
- en **paysage / écran bas** (`max-height: 500px`) : fenêtre alignée en haut,
  hauteur bornée à l'écran, actions collées en bas ;
- modale « Importer CSV » : `min-width: 0` sur mobile ;
- barres d'action à **44 px** de haut, listes internes bornées en `dvh`.

### Lisibilité et proportions
- cartes KPI de hauteur identique, courbes alignées ;
- axes de mois abrégés (`sept. 25`) + `maxRotation: 0` + `maxTicksLimit` sur les
  5 graphiques concernés ;
- champs de saisie de hauteur uniforme (42 px), listes déroulantes iOS
  redessinées (chevron discret au lieu du gris natif) ;
- tableaux : colonnes *Compte* et *Catégorie* masquées sur téléphone pour les
  transactions (Montant et Actions visibles sans défilement), colonne *Mois*
  figée sur le tableau d'analyse ;
- cartes de statistiques regroupées (1 grande + 2 côte à côte).

### Tactile
- `html.is-touch` (basé sur `hover: none` **et** `pointer: coarse`, donc un
  portable tactile à souris n'est pas affecté) : les crayons d'édition
  deviennent **visibles en permanence** ;
- boutons ✏️/🗑️ **38 px**, interrupteurs **46 × 26 px**, cases à cocher
  **20 px**, curseurs 34 px, boutons de modale 44 px.

### Code
- `var(--tx2)` → `var(--text2)` ;
- classe `undefined` → `income` / `expense` ;
- `<div class="app">` refermé ;
- `＋` → `+`, commentaire corrompu restauré ;
- sélecteurs en double supprimés, `min-width: 480px` du tableau limité au seul
  tableau qui en a besoin ;
- helpers `shortMonthLabel()` / `fmtDateFr()` / `monthAxisTicks()` pour éviter
  de dupliquer la logique d'affichage des dates.

---

## 4. Ce qui n'a volontairement PAS été touché

- aucune refonte visuelle : couleurs, typographie, structure des pages et
  disposition bureau sont inchangées (vérifié : sur 1280 px, les cartes KPI
  gardent leur affichage en bloc et les crayons restent réservés au survol) ;
- pas de navigation inférieure ajoutée, pas de réorganisation des pages ;
- les sélecteurs d'identité de l'app (`is-mobile`, `is-tablet`, `is-tiny`)
  restent inchangés pour ne rien casser ailleurs.

---

## 5. Vérifications automatisées

Navigateur réel (Chromium) sur 6 formats — iPhone 12, iPhone 12 paysage,
iPhone SE, iPhone 14 Pro Max, iPad mini, bureau — pour les 7 pages, 8 modales
et la fenêtre de connexion :

- **25/25** contrôles fonctionnels passés ;
- **0** débordement horizontal, **0** graphique à axe vide, **0** erreur
  JavaScript, sur tous les formats ;
- sur 320 px, 375 px et 390 px : aucun texte tronqué, aucune carte de hauteur
  différente.
