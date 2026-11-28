# Socle

Composants Vue 3 accessibles, bâtis sur les éléments natifs du navigateur : `<dialog>`, l'API Popover et le CSS Anchor Positioning. Le style repose sur Tailwind CSS v4.

| Composant | Rôle |
| --- | --- |
| [`SocleInput`](docs/SocleInput.md) | Champ de saisie texte (avec préfixe / suffixe) |
| [`SocleSelect`](docs/SocleSelect.md) | Liste déroulante personnalisée (combobox) |
| [`SocleDatePicker`](docs/SocleDatePicker.md) | Sélecteur de date avec calendrier |
| [`SocleDialog`](docs/SocleDialog.md) | Boîte de dialogue déplaçable, modale ou non |
| [`SoclePopover`](docs/SoclePopover.md) | Panneau flottant ancré à un bouton (menu, aide, petit formulaire) |
| [`SocleTableHead`](docs/SocleTableHead.md) | En-têtes de tableau : colonnes redimensionnables et triables |
| [`SocleField`](docs/SocleField.md) | Habillage commun d'un champ : label, aide, erreur |

La documentation de chaque composant (props, v-model, slots, clavier) est dans son propre fichier, dans le dossier [`docs/`](docs/).

## Sommaire

- [Prérequis](#prérequis)
- [Installation](#installation)
- [Démo](#démo)
- [Principes communs](#principes-communs)
- [Styles partagés](#styles-partagés)
- [Organisation du projet](#organisation-du-projet)

## Prérequis

- **Vue ≥ 3.5** (`useId`, `defineModel`, composants génériques).
- **Tailwind CSS v4**.
- Un bundler qui compile les SFC et le TypeScript (Vite + `@vitejs/plugin-vue`, par exemple). Le paquet est distribué en sources (`.vue`, `.ts`), sans étape de build.
- Un navigateur récent qui prend en charge `<dialog>`, l'attribut `popover`, le CSS Anchor Positioning et `@starting-style`. La flèche de `SoclePopover` demande en plus les requêtes de conteneur ancré (`container-type: anchored`) : sans elles, elle est simplement masquée.

## Installation

> Le guide [INTEGRATION.md](INTEGRATION.md) détaille l'intégration dans un projet Vite + Vue + Tailwind, étape par étape : installation du paquet, configuration de Vite, Tailwind et TypeScript, et problèmes fréquents.

```ts
import { SocleInput, SocleSelect, SocleDatePicker, SocleDialog, SoclePopover } from 'socle-ui'
```

Chaque composant peut aussi être importé seul :

```ts
import SocleSelect from 'socle-ui/SocleSelect.vue'
```

### Configuration de Tailwind

Tailwind v4 ignore `node_modules` lors de la détection automatique des sources. Il faut donc lui indiquer d'analyser le paquet, sinon les classes utilisées par les composants ne sont pas générées. Dans la feuille CSS principale de l'application :

```css
@import "tailwindcss";
@source "../node_modules/socle-ui";
```

Le chemin est relatif à cette feuille CSS : adaptez-le à votre projet.

La feuille `socle.css` (animations, ancrage) est importée automatiquement par les composants qui en ont besoin. Rien à ajouter.

## Démo

Le dossier `demo/` contient une application Vite + Vue 3 + Tailwind CSS v4 qui utilise tous les composants : formulaire avec validation, affichage du `v-model` et des données envoyées, tableau triable aux colonnes redimensionnables, popovers (placements, menu, filtres persistants), boîtes de dialogue modale, non modale et de confirmation.

```sh
cd demo
npm install
npm run dev        # serveur de développement
npm run build      # vérification des types (vue-tsc) + build de production
```

Elle importe `socle-ui` directement depuis les sources du dossier parent (alias dans `vite.config.ts`) : toute modification d'un composant est visible immédiatement. `npm run typecheck` vérifie aussi les types des composants eux-mêmes.

## Principes communs

### Champs de formulaire

`SocleInput`, `SocleSelect` et `SocleDatePicker` partagent les mêmes props d'habillage, fournies par `SocleField` :

| Prop | Type | Description |
| --- | --- | --- |
| `label` | `string` | Libellé affiché au-dessus du champ et relié au contrôle. |
| `hint` | `string` | Texte d'aide sous le champ, masqué quand une erreur est affichée. |
| `error` | `string` | Message d'erreur : colore le champ en rouge, affiche le message et pose `aria-invalid`. |
| `required` | `boolean` | Astérisque sur le label et `aria-required`. |
| `disabled` | `boolean` | Désactive le champ. |
| `name` | `string` | Nom du champ pour les envois de formulaire classiques. |

- **Largeur** : un champ occupe toute la largeur de son conteneur. Pour la limiter, passez une classe au composant : elle s'applique à son conteneur (`<SocleInput class="max-w-xs" … />`).
- **Validation** : elle reste à faire côté appelant. Les composants affichent l'erreur, ils ne la calculent pas.
- **Annonce des erreurs** : le message est placé dans une zone `aria-live="polite"`, présente en permanence. Les lecteurs d'écran l'annoncent sans interrompre l'utilisateur.
- **Formulaires classiques** : quand `name` est défini, `SocleSelect` et `SocleDatePicker` rendent un `<input type="hidden">` qui porte la valeur. Ce champ caché est désactivé avec le composant : comme pour un champ natif, sa valeur n'est alors pas envoyée. Le navigateur ne valide jamais un champ caché, d'où la validation côté appelant.
- **Clic sur le label** : pour `SocleSelect` et `SocleDatePicker`, il donne le focus au bouton sans ouvrir la liste ou le calendrier, comme pour un `<select>` natif.

### Libellés et traduction

Les textes internes sont en français par défaut. `SocleDialog` et `SocleDatePicker` acceptent une prop `labels` pour les remplacer en partie ou en totalité :

```vue
<SocleDialog v-model="open" :labels="{ close: 'Close' }" />
```

---

## Styles partagés

### `socle.css`

Contient ce qui ne s'exprime pas en utilitaires Tailwind : les animations d'ouverture et de fermeture, le `::backdrop` du dialogue et le CSS Anchor Positioning des popovers. Chaque composant qui en a besoin l'importe, et le bundler ne l'inclut qu'une fois.

Ces styles sont globaux, d'où le préfixe `socle-` sur tous les sélecteurs : `.socle-dialog`, `.socle-select-trigger`, `.socle-select-listbox`, `.socle-datepicker-trigger`, `.socle-datepicker-popover`, `.socle-popover`, `.socle-popover-body`, `.socle-popover-arrow`, `.socle-table-resizing` (posée sur `<html>` pendant un redimensionnement de colonne), et la variable `--socle-anchor`.

Les animations sont désactivées quand l'utilisateur a demandé à réduire les animations (`prefers-reduced-motion`).

### `classes.ts`

Classes Tailwind communes aux composants. `fieldBoxClass()` donne le cadre d'un champ : bordure, anneau de focus, état d'erreur et survol.

```ts
import { fieldBoxClass } from 'socle-ui/classes'

fieldBoxClass({ focus: 'within', error: props.error, disabled: props.disabled })
```

| Option | Description |
| --- | --- |
| `focus` | `'within'` : le cadre contient l'élément focalisable (un `<input>`). `'visible'` : le cadre est lui-même focalisable (un `<button>`). |
| `error` | Met le cadre en erreur (rouge). |
| `disabled` | Supprime l'effet de survol. |

Dans ce fichier, les noms de classes sont toujours écrits en entier : Tailwind ne génère que les classes qu'il trouve telles quelles dans les sources. Ne pas les construire par concaténation (`` `focus-${mode}:ring-2` ``).

## Organisation du projet

```
index.ts              Point d'entrée : exporte tous les composants
SocleField.vue        Habillage commun des champs
SocleInput.vue
SocleSelect.vue
SocleDatePicker.vue
SocleDialog.vue
SoclePopover.vue      Panneau flottant ancré (popover + anchor positioning)
SocleTableHead.vue    En-têtes de tableau redimensionnables et triables
table.ts              Types des colonnes et fonction de tri sortRows()
socle.css             Styles globaux (animations, ancrage)
classes.ts            Classes Tailwind partagées
docs/                 Documentation : un fichier par composant
demo/                 Application d'exemple (Vite + Vue 3 + Tailwind)
```

### Conventions

- **Code** : chaque composant documente son usage dans un commentaire en tête de fichier.
- **Langue** : les textes et les commentaires sont en français.
- **Accessibilité** : rôles ARIA, navigation clavier complète et annonces des erreurs.
- **Éléments natifs** : on s'appuie sur ce que le navigateur sait faire (`<dialog>`, `popover`, anchor positioning) plutôt que de le réimplémenter en JavaScript.
