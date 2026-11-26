# Socle

Composants Vue 3 accessibles, bâtis sur les éléments natifs du navigateur : `<dialog>`, l'API Popover et le CSS Anchor Positioning. Le style repose sur Tailwind CSS v4.

| Composant | Rôle |
| --- | --- |
| [`SocleInput`](#socleinput) | Champ de saisie texte (avec préfixe / suffixe) |
| [`SocleSelect`](#socleselect) | Liste déroulante personnalisée (combobox) |
| [`SocleDatePicker`](#socledatepicker) | Sélecteur de date avec calendrier |
| [`SocleDialog`](#socledialog) | Boîte de dialogue déplaçable, modale ou non |
| [`SoclePopover`](#soclepopover) | Panneau flottant ancré à un bouton (menu, aide, petit formulaire) |
| [`SocleTableHead`](#socletablehead) | En-têtes de tableau : colonnes redimensionnables et triables |
| [`SocleField`](#soclefield) | Habillage commun d'un champ : label, aide, erreur |

## Sommaire

- [Prérequis](#prérequis)
- [Installation](#installation)
- [Démo](#démo)
- [Principes communs](#principes-communs)
- [Composants](#socleinput)
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
import { SocleInput, SocleSelect, SocleDatePicker, SocleDialog, SoclePopover } from 'socle'
```

Chaque composant peut aussi être importé seul :

```ts
import SocleSelect from 'socle/SocleSelect.vue'
```

### Configuration de Tailwind

Tailwind v4 ignore `node_modules` lors de la détection automatique des sources. Il faut donc lui indiquer d'analyser le paquet, sinon les classes utilisées par les composants ne sont pas générées. Dans la feuille CSS principale de l'application :

```css
@import "tailwindcss";
@source "../node_modules/socle";
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

Elle importe `socle` directement depuis les sources du dossier parent (alias dans `vite.config.ts`) : toute modification d'un composant est visible immédiatement. `npm run typecheck` vérifie aussi les types des composants eux-mêmes.

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

## SocleInput

Champ de saisie texte.

```vue
<SocleInput
  v-model.trim="email"
  label="E-mail"
  type="email"
  name="email"
  placeholder="nom@exemple.fr"
  hint="Nous ne l'utiliserons que pour vous répondre."
  :error="errors.email"
  required
  autocomplete="email"
/>
```

### Props

En plus des [props communes](#champs-de-formulaire) :

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `type` | `'text' \| 'email' \| 'password' \| 'search' \| 'tel' \| 'url' \| 'number'` | `'text'` | Type de l'`<input>`. |
| `placeholder` | `string` | | Texte indicatif. |
| `readonly` | `boolean` | `false` | Lecture seule (fond grisé). |

### v-model

- **Valeur** : `string | number | null`.
- **Modificateurs** : `.trim`, `.number` et `.lazy` sont pris en charge, comme sur un `<input>` natif. La frappe n'est pas perturbée : saisir « 1.0 » avec `.number` ne réécrit pas le champ en « 1 ».

### Attributs transmis

Tout attribut non déclaré est transmis à l'`<input>` lui-même, et non au conteneur : `autocomplete`, `maxlength`, `min`, `step`, `inputmode`, `@keydown`… Un `id` passé en attribut devient celui de l'`<input>`, pratique pour un `<label for>` externe. Seuls `class` et `style` vont sur le conteneur.

### Slots

| Slot | Description |
| --- | --- |
| `prefix` | Contenu affiché dans le champ, avant le texte (icône…). |
| `suffix` | Contenu affiché dans le champ, après le texte (unité, bouton…). |

```vue
<SocleInput v-model.number="price" label="Prix" type="number" step="0.01">
  <template #suffix>€</template>
</SocleInput>
```

---

## SocleSelect

Liste déroulante personnalisée, accessible au clavier (rôle `combobox` + `listbox`). La liste est un popover placé au-dessus du reste de la page (*top layer*) et ancré au bouton. S'il manque de place en bas, elle s'ouvre au-dessus du bouton.

```vue
<SocleSelect
  v-model="country"
  label="Pays"
  name="country"
  :options="[
    { value: 'fr', label: 'France' },
    { value: 'be', label: 'Belgique' },
    { value: 'lu', label: 'Luxembourg', disabled: true },
  ]"
  hint="Pays de livraison."
  :error="errors.country"
  required
/>
```

### Props

En plus des [props communes](#champs-de-formulaire) :

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `options` | `SelectOption<T>[]` | (obligatoire) | Options proposées. |
| `placeholder` | `string` | `'Sélectionner…'` | Texte affiché tant qu'aucune option n'est choisie. |
| `ariaLabel` | `string` | | Nom accessible quand il n'y a pas de `label` visible. À défaut, c'est le placeholder qui sert de nom. |

```ts
import type { SelectOption } from 'socle'

interface SelectOption<V> {
  value: V          // string | number
  label: string
  disabled?: boolean
}
```

### v-model

- **Valeur** : `T | null`, où `T` est le type des `value` (`string` ou `number`). Le composant est générique : le type est déduit des options.

### Slots

| Slot | Props | Description |
| --- | --- | --- |
| `option` | `{ option, selected }` | Rendu personnalisé d'une option dans la liste. |

```vue
<SocleSelect v-model="user" :options="users">
  <template #option="{ option }">
    <span class="truncate">{{ option.label }}</span>
    <span class="text-xs opacity-70">#{{ option.value }}</span>
  </template>
</SocleSelect>
```

### Clavier

| Touche | Action |
| --- | --- |
| `↓` / `↑` | Ouvre la liste, puis passe à l'option suivante / précédente. |
| `Début` / `Fin` | Première / dernière option. |
| `Entrée` / `Espace` | Ouvre la liste, puis choisit l'option active. |
| `Échap` | Ferme la liste. |
| `Tab` | Ferme la liste et passe au champ suivant. |
| Lettres | Recherche au clavier : ouvre la liste et va à l'option qui commence par le texte tapé (« new y » → « New York »). Retaper la même lettre passe d'une option en « b » à la suivante. |

---

## SocleDatePicker

Sélecteur de date. Le calendrier est un popover ancré au bouton. Faute de place, il s'ouvre au-dessus du bouton ou s'aligne sur son bord droit.

```vue
<SocleDatePicker
  v-model="date"
  label="Date de livraison"
  name="delivery_date"
  min="2026-11-24"
  max="2027-03-31"
  hint="Livraison du lundi au samedi."
  :error="errors.date"
  required
/>
```

### Props

En plus des [props communes](#champs-de-formulaire) :

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `min` | `string` | | Date minimale incluse, au format `YYYY-MM-DD`. |
| `max` | `string` | | Date maximale incluse, au format `YYYY-MM-DD`. |
| `placeholder` | `string` | `'Choisir une date'` | Texte affiché tant qu'aucune date n'est choisie. |
| `locale` | `string` | `'fr-FR'` | Langue des noms de mois et de jours (via `Intl`). |
| `firstDayOfWeek` | `0`–`6` | `1` | Premier jour de la semaine : `0` = dimanche, `1` = lundi… |
| `ariaLabel` | `string` | | Nom accessible quand il n'y a pas de `label` visible. À défaut : « Calendrier ». |
| `labels` | `Partial<Labels>` | | Textes des boutons (voir ci-dessous). |

### v-model

- **Valeur** : chaîne ISO `"YYYY-MM-DD"` ou `null`.
- **Pas de fuseau horaire** : la date est en heure locale. Pas de décalage d'un jour selon le fuseau de l'utilisateur.
- **Dates invalides** : une valeur comme `2026-02-31` est ignorée.

### Fonctionnement

- **Navigation** : les boutons `‹` `›` changent de mois, `«` `»` d'année.
- **Choix de l'année** : un clic sur le titre du mois ouvre une grille de 12 années, pratique pour une date de naissance ou une échéance lointaine.
- **Raccourcis** : le pied du calendrier propose « Aujourd'hui » et « Effacer ».
- **Bornes** : les dates hors de `min` / `max` sont désactivées et ne peuvent pas être atteintes au clavier.

### Libellés

| Clé | Défaut |
| --- | --- |
| `previousMonth` | Mois précédent |
| `nextMonth` | Mois suivant |
| `previousYear` | Année précédente |
| `nextYear` | Année suivante |
| `previousYears` | 12 années précédentes |
| `nextYears` | 12 années suivantes |
| `chooseYear` | Choisir une année |
| `today` | Aujourd'hui |
| `clear` | Effacer |
| `calendar` | Calendrier |

### Clavier

| Touche | Action |
| --- | --- |
| `↓` (sur le bouton) | Ouvre le calendrier. |
| Flèches | Jour précédent / suivant, semaine précédente / suivante. |
| `Début` / `Fin` | Début / fin de la semaine. |
| `Page↑` / `Page↓` | Mois précédent / suivant. |
| `Maj` + `Page↑` / `Page↓` | Année précédente / suivante. |
| `Entrée` / `Espace` | Choisit la date. |
| `Échap` | Ferme le calendrier, ou revient aux jours depuis la grille des années. |

Dans la grille des années : flèches pour se déplacer, `Début` / `Fin` pour la première / dernière année de la page, `Page↑` / `Page↓` pour la page précédente / suivante.

---

## SocleDialog

Boîte de dialogue basée sur l'élément natif `<dialog>`. On la déplace en faisant glisser son titre.

```vue
<SocleDialog v-model="open" title="Modifier le profil" width="30rem">
  <p>Contenu de la boîte…</p>
  <template #footer>
    <button @click="open = false">Annuler</button>
    <button class="rounded-md bg-teal-600 px-3 py-1.5 text-sm text-white">Enregistrer</button>
  </template>
</SocleDialog>
```

### Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `title` | `string` | | Titre affiché dans l'en-tête, qui sert aussi de nom accessible. |
| `modal` | `boolean` | `true` | `true` : fond assombri, reste de la page inerte, focus piégé dans la boîte. `false` : la page reste utilisable. |
| `closeOnBackdrop` | `boolean` | `true` | En mode modal, un clic sur le fond assombri ferme la boîte. |
| `width` | `string` | `'28rem'` | Largeur CSS de la boîte, plafonnée à la largeur de la fenêtre. |
| `labels` | `Partial<{ close: string }>` | | Libellé du bouton de fermeture (défaut : « Fermer »). |

### v-model

- **Valeur** : `boolean`, la boîte est ouverte ou fermée.
- **Synchronisation** : le v-model repasse à `false` quel que soit le mode de fermeture : bouton ✕, `Échap`, clic sur le fond, `<form method="dialog">`.

### Slots

| Slot | Description |
| --- | --- |
| *(défaut)* | Contenu de la boîte, avec défilement s'il dépasse la hauteur disponible. |
| `title` | Titre riche, à la place de la prop `title`. |
| `footer` | Pied de la boîte, en général les boutons d'action. |

### Fonctionnement

- **Déplacement** : glisser le titre à la souris, au doigt ou au stylet. Un double-clic sur le titre recentre la boîte. La boîte reste toujours entièrement visible dans la fenêtre.
- **Réouverture** : la boîte se rouvre toujours au centre.
- **Défilement** : en mode modal, la page derrière ne défile pas tant que la boîte est ouverte.
- **`Échap`** : ferme la boîte dans les deux modes.
- **Changement de mode** : modifier `modal` pendant que la boîte est ouverte la rouvre dans le nouveau mode, sans la recentrer.

---

## SoclePopover

Panneau flottant ancré à un bouton : menu d'actions, aide contextuelle, petit formulaire. Le comportement est entièrement natif : aucun JavaScript de positionnement ni de gestion des clics.

```vue
<SoclePopover placement="bottom" align="start" role="dialog" aria-label="Filtres" class="w-72">
  <template #trigger="{ props }">
    <button v-bind="props" type="button">Filtres</button>
  </template>
  <p>Contenu du panneau…</p>
</SoclePopover>
```

Le bouton déclencheur est le vôtre : liez-lui `props` avec `v-bind`. Ces props posent `popovertarget` (le navigateur gère alors seul l'ouverture au clic et `aria-expanded`) et `anchor-name` (le panneau s'y ancre).

### Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `placement` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'bottom'` | Côté du bouton où s'ouvre le panneau. Retourné automatiquement si la place manque. |
| `align` | `'start' \| 'center' \| 'end'` | `'center'` | Alignement sur l'autre axe : `start` aligne sur le bord gauche (ou haut) du bouton, `end` sur le bord droit (ou bas). |
| `arrow` | `boolean` | `true` | Flèche pointant vers le bouton. |
| `persistent` | `boolean` | `false` | Le panneau ne se ferme ni par un clic extérieur, ni à l'ouverture d'un autre popover. `Échap`, le bouton et le v-model le ferment toujours. |

### Attributs transmis

`class`, `style` et tout attribut non déclaré vont sur le panneau, et non sur le bouton : largeur (`class="w-72"`), `role="dialog"` et `aria-label` quand le panneau contient un formulaire, `id`… Les variables CSS suivantes s'y posent aussi :

| Variable | Défaut | Description |
| --- | --- | --- |
| `--socle-popover-padding` | `0.75rem` | Marge intérieure du contenu. |
| `--socle-popover-offset` | `0.75rem` avec flèche, `0.375rem` sans | Écart entre le bouton et le panneau. |
| `--socle-popover-max-width` | `min(24rem, 100vw - 1rem)` | Largeur maximale. |
| `--socle-popover-arrow-size` | `0.75rem` | Taille de la flèche. |

```vue
<SoclePopover class="w-48 [--socle-popover-padding:0.25rem]" :arrow="false">…</SoclePopover>
```

### v-model

- **Valeur** : `boolean`, le panneau est ouvert ou fermé. Facultatif : sans v-model, le popover fonctionne seul.
- **Synchronisation** : le v-model suit toutes les fermetures natives (bouton, `Échap`, clic extérieur).
- **Méthodes exposées** : `show()`, `hide()` et `toggle()`, via une ref de composant.

### Slots

| Slot | Props | Description |
| --- | --- | --- |
| `trigger` | `{ props, open }` | Bouton déclencheur. `props` est à lier avec `v-bind` ; `open` indique si le panneau est ouvert. |
| *(défaut)* | | Contenu du panneau, avec défilement s'il dépasse. |

### Fonctionnement

- **Fermeture** : `Échap` ou un clic en dehors (« light dismiss »). Ouvrir un autre popover ferme le précédent, sauf s'il le contient. Une liste `SocleSelect` ou un calendrier `SocleDatePicker` placés dans le panneau ne le ferment pas.
- **Focus** : le focus reste sur le bouton à l'ouverture. `Tab` entre ensuite dans le panneau, même si celui-ci est loin dans le DOM. À la fermeture, le focus revient au bouton s'il était dans le panneau. Un `autofocus` dans le contenu est respecté.
- **Placement** : `position-area` place le panneau, `position-try-fallbacks` le retourne (haut ↔ bas, gauche ↔ droite) quand la place manque. Le panneau est masqué si le bouton sort de la zone visible (`position-visibility`).
- **Flèche** : les requêtes de conteneur ancré (`@container anchored(fallback: …)`) indiquent quel repli le navigateur a choisi : la flèche passe du côté du bouton. Ces règles sont injectées une seule fois par le composant (feuille adoptée), car les minifieurs CSS comme Lightning CSS ne savent pas encore les lire.
- **Animation** : fondu et léger zoom, à l'ouverture comme à la fermeture (`@starting-style`, `transition-behavior: allow-discrete`).

---

## SocleTableHead

Ligne d'en-têtes d'un tableau, à placer entre `<thead>` et `</thead>`. Les colonnes se redimensionnent à la souris, au doigt ou au clavier, et se trient d'un clic sur leur en-tête. Le composant ne trie pas les lignes : il tient à jour l'état du tri, et l'appelant trie ses données, avec `sortRows()` ou sa propre fonction. Le `name` de chaque colonne fait le lien entre les deux.

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { SocleTableHead, sortRows, type TableColumn, type TableSort } from 'socle'

const columns: TableColumn<Order>[] = [
  { name: 'ref', label: 'Référence', sortable: true, width: 150 },
  { name: 'client', label: 'Client', type: 'string', sortable: true, width: 220, minWidth: 100 },
  { name: 'date', label: 'Date', type: 'date', sortable: true, width: 120 },
  { name: 'amount', label: 'Montant', type: 'number', sortable: true, width: 130 },
  { name: 'note', label: 'Remarque', width: 200, resizable: false },
]

const sort = ref<TableSort | null>(null)
const widths = ref<Record<string, number>>({})
const rows = computed(() => sortRows(orders.value, columns, sort.value))
</script>

<template>
  <div class="overflow-x-auto">
    <table>
      <thead>
        <SocleTableHead v-model:sort="sort" v-model:widths="widths" :columns="columns" />
      </thead>
      <tbody>
        <tr v-for="o in rows" :key="o.id">
          <td class="truncate">{{ o.ref }}</td>
          …
          <td class="truncate text-right">{{ o.amount }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
```

### Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `columns` | `TableColumn<R>[]` | (obligatoire) | Colonnes du tableau. |
| `autoTableWidth` | `boolean` | `true` | Passe le `<table>` en `table-layout: fixed` et lui donne pour largeur la somme des colonnes. Avec `false`, le composant ne touche pas au tableau. |
| `step` | `number` | `10` | Pas du redimensionnement au clavier, en pixels (×5 avec `Maj`). |
| `labels` | `Partial<{ resize: string }>` | | Nom accessible des poignées, suivi du libellé de la colonne (défaut : « Redimensionner la colonne »). |

```ts
import type { TableColumn, TableSort } from 'socle'

interface TableColumn<R> {
  name: string                         // identifiant, transmis au tri ; sortRows() lit row[name]
  label: string                        // libellé affiché
  type?: 'string' | 'date' | 'number'  // défaut 'string' ; 'number' est aligné à droite
  sortable?: boolean                   // défaut false
  width?: number                       // largeur initiale en px, défaut 160
  minWidth?: number                    // défaut 80
  maxWidth?: number                    // pas de limite par défaut
  resizable?: boolean                  // défaut true
  value?: (row: R) => unknown          // valeur triée, si ce n'est pas row[name]
  compare?: (a: R, b: R) => number     // comparaison personnalisée (ordre croissant)
}

interface TableSort {
  name: string                         // name de la colonne triée
  direction: 'asc' | 'desc'
}
```

### v-model

| Modèle | Valeur | Description |
| --- | --- | --- |
| `v-model:sort` | `TableSort \| null` | Colonne triée et sens. Un clic sur un en-tête passe de croissant à décroissant, puis sans tri. |
| `v-model:widths` | `Record<string, number>` | Largeurs modifiées par l'utilisateur, par `name` de colonne. Les colonnes absentes gardent leur `width`. Pratique pour mémoriser les largeurs (`localStorage`…). |

Les deux modèles sont facultatifs : sans `v-model`, le composant garde son état pour lui.

### Tri : `sortRows()`

```ts
sortRows(rows, columns, sort, locale = 'fr-FR'): R[]
```

Renvoie une copie triée des lignes, sans modifier l'original. Le tri est stable, et les valeurs vides (`null`, `undefined`, `''`, nombre invalide) vont toujours en fin de liste, quel que soit le sens. Selon le `type` de la colonne :

| Type | Comparaison |
| --- | --- |
| `string` | `Intl.Collator` : ignore la casse et les accents, ordre naturel des nombres (« item 9 » avant « item 10 »). |
| `number` | Numérique. Accepte les nombres et les chaînes écrites à la française (« 1 234,50 »). |
| `date` | Chronologique. Accepte `Date`, horodatage, chaîne ISO (`2026-11-26`, en heure locale) ou française (`26/11/2026`). |

Une colonne peut fournir `value` pour trier sur une autre valeur que `row[name]`, ou `compare` pour une comparaison entièrement personnalisée.

### Largeurs

- Chaque `<th>` reçoit sa largeur. Avec `autoTableWidth`, le tableau passe en `table-layout: fixed` et prend pour largeur la somme des colonnes : agrandir une colonne élargit le tableau au lieu de rétrécir les autres. Placez-le dans un conteneur `overflow-x-auto`.
- Le contenu des cellules ne doit pas dépasser : ajoutez `truncate` sur les `<td>`.
- Les colonnes `number` sont alignées à droite dans l'en-tête ; alignez les cellules de la même façon (`text-right`).

### Slots

| Slot | Props | Description |
| --- | --- | --- |
| `header` | `{ column, direction }` | Contenu d'un en-tête, à la place du libellé. `direction` vaut `'asc'`, `'desc'` ou `null`. |

### Accessibilité et clavier

- Les en-têtes triables sont des boutons ; la colonne triée porte `aria-sort` (`ascending` / `descending`).
- Chaque poignée est un séparateur focalisable (`role="separator"`, motif « window splitter » de l'APG) qui annonce la largeur courante.

| Touche (sur la poignée) | Action |
| --- | --- |
| `←` / `→` | Rétrécit / élargit la colonne de `step` pixels (`Maj` : ×5). |
| `Début` / `Fin` | Largeur minimale / maximale (`Fin` seulement si `maxWidth` est défini). |
| `Échap` | Pendant un glisser à la souris : annule et rend la largeur de départ. |

À la souris, un double-clic sur la poignée rend la largeur initiale de la colonne.

---

## SocleField

Habillage commun d'un champ de formulaire : label (avec astérisque si requis), message d'erreur annoncé et texte d'aide. C'est lui qu'utilisent `SocleInput`, `SocleSelect` et `SocleDatePicker`. Il sert aussi à habiller un autre contrôle avec la même présentation.

```vue
<SocleField control-id="bio" label="Biographie" :error="err" v-slot="{ describedBy }">
  <textarea
    id="bio"
    :aria-describedby="describedBy"
    :aria-invalid="err ? true : undefined"
  />
</SocleField>
```

### Props

| Prop | Type | Description |
| --- | --- | --- |
| `controlId` | `string` | (obligatoire) `id` du contrôle, cible du `<label for>`. |
| `label` | `string` | Libellé du champ. |
| `required` | `boolean` | Affiche l'astérisque. Pensez à poser `aria-required` sur le contrôle. |
| `hint` | `string` | Texte d'aide, masqué quand une erreur est affichée. |
| `error` | `string` | Message d'erreur. Pensez à poser `aria-invalid` sur le contrôle. |

### Slot par défaut

| Prop du slot | Description |
| --- | --- |
| `labelId` | `id` du label, pour `aria-labelledby` (utile pour un popover ou une liste). |
| `describedBy` | `id` du message d'erreur ou d'aide à placer dans `aria-describedby`, ou `undefined`. |

### Événements et exposition

- **`@label-click`** : émis au clic sur le label. Utile pour un contrôle qui ne doit pas être activé par ce clic : appeler `preventDefault()`, puis donner le focus soi-même.
- **Attributs** : `class`, `style` et les écouteurs non déclarés (`@focusout`, `@keydown`…) vont sur le conteneur.
- **`root`** : élément conteneur, exposé via une ref de composant. Il permet de vérifier si le focus ou un clic est à l'intérieur du champ.

---

## Styles partagés

### `socle.css`

Contient ce qui ne s'exprime pas en utilitaires Tailwind : les animations d'ouverture et de fermeture, le `::backdrop` du dialogue et le CSS Anchor Positioning des popovers. Chaque composant qui en a besoin l'importe, et le bundler ne l'inclut qu'une fois.

Ces styles sont globaux, d'où le préfixe `socle-` sur tous les sélecteurs : `.socle-dialog`, `.socle-select-trigger`, `.socle-select-listbox`, `.socle-datepicker-trigger`, `.socle-datepicker-popover`, `.socle-popover`, `.socle-popover-body`, `.socle-popover-arrow`, `.socle-table-resizing` (posée sur `<html>` pendant un redimensionnement de colonne), et la variable `--socle-anchor`.

Les animations sont désactivées quand l'utilisateur a demandé à réduire les animations (`prefers-reduced-motion`).

### `classes.ts`

Classes Tailwind communes aux composants. `fieldBoxClass()` donne le cadre d'un champ : bordure, anneau de focus, état d'erreur et survol.

```ts
import { fieldBoxClass } from 'socle/classes'

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
demo/                 Application d'exemple (Vite + Vue 3 + Tailwind)
```

### Conventions

- **Code** : chaque composant documente son usage dans un commentaire en tête de fichier.
- **Langue** : les textes et les commentaires sont en français.
- **Accessibilité** : rôles ARIA, navigation clavier complète et annonces des erreurs.
- **Éléments natifs** : on s'appuie sur ce que le navigateur sait faire (`<dialog>`, `popover`, anchor positioning) plutôt que de le réimplémenter en JavaScript.
