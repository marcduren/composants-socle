[← Retour au README](../README.md)

# SocleTableHead

Ligne d'en-têtes d'un tableau, à placer entre `<thead>` et `</thead>`. Les colonnes se redimensionnent à la souris, au doigt ou au clavier, et se trient d'un clic sur leur en-tête. Le composant ne trie pas les lignes : il tient à jour l'état du tri, et l'appelant trie ses données, avec `sortRows()` ou sa propre fonction. Le `name` de chaque colonne fait le lien entre les deux.

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { SocleTableHead, sortRows, type TableColumn, type TableSort } from 'socle-ui'

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

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `columns` | `TableColumn<R>[]` | (obligatoire) | Colonnes du tableau. |
| `autoTableWidth` | `boolean` | `true` | Passe le `<table>` en `table-layout: fixed` et lui donne pour largeur la somme des colonnes. Avec `false`, le composant ne touche pas au tableau. |
| `step` | `number` | `10` | Pas du redimensionnement au clavier, en pixels (×5 avec `Maj`). |
| `labels` | `Partial<{ resize: string }>` | | Nom accessible des poignées, suivi du libellé de la colonne (défaut : « Redimensionner la colonne »). |

```ts
import type { TableColumn, TableSort } from 'socle-ui'

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

## v-model

| Modèle | Valeur | Description |
| --- | --- | --- |
| `v-model:sort` | `TableSort \| null` | Colonne triée et sens. Un clic sur un en-tête passe de croissant à décroissant, puis sans tri. |
| `v-model:widths` | `Record<string, number>` | Largeurs modifiées par l'utilisateur, par `name` de colonne. Les colonnes absentes gardent leur `width`. Pratique pour mémoriser les largeurs (`localStorage`…). |

Les deux modèles sont facultatifs : sans `v-model`, le composant garde son état pour lui.

## Tri : `sortRows()`

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

## Largeurs

- Chaque `<th>` reçoit sa largeur. Avec `autoTableWidth`, le tableau passe en `table-layout: fixed` et prend pour largeur la somme des colonnes : agrandir une colonne élargit le tableau au lieu de rétrécir les autres. Placez-le dans un conteneur `overflow-x-auto`.
- Le contenu des cellules ne doit pas dépasser : ajoutez `truncate` sur les `<td>`.
- Les colonnes `number` sont alignées à droite dans l'en-tête ; alignez les cellules de la même façon (`text-right`).

## Slots

| Slot | Props | Description |
| --- | --- | --- |
| `header` | `{ column, direction }` | Contenu d'un en-tête, à la place du libellé. `direction` vaut `'asc'`, `'desc'` ou `null`. |

## Accessibilité et clavier

- Les en-têtes triables sont des boutons ; la colonne triée porte `aria-sort` (`ascending` / `descending`).
- Chaque poignée est un séparateur focalisable (`role="separator"`, motif « window splitter » de l'APG) qui annonce la largeur courante.

| Touche (sur la poignée) | Action |
| --- | --- |
| `←` / `→` | Rétrécit / élargit la colonne de `step` pixels (`Maj` : ×5). |
| `Début` / `Fin` | Largeur minimale / maximale (`Fin` seulement si `maxWidth` est défini). |
| `Échap` | Pendant un glisser à la souris : annule et rend la largeur de départ. |

À la souris, un double-clic sur la poignée rend la largeur initiale de la colonne.
