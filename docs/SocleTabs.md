[← Retour au README](../README.md)

# SocleTabs

Onglets accessibles, conformes au motif WAI-ARIA « Tabs » (`tablist`, `tab`, `tabpanel`). Les panneaux masqués utilisent `hidden="until-found"` : la recherche du navigateur (`Ctrl+F`) trouve aussi leur texte, et sélectionne l'onglet qui le contient.

```vue
<SocleTabs
  v-model="tab"
  aria-label="Fiche client"
  :tabs="[
    { value: 'general', label: 'Général' },
    { value: 'orders', label: 'Commandes' },
    { value: 'archive', label: 'Archives', disabled: true },
  ]"
>
  <template #general>Coordonnées…</template>
  <template #orders>Liste des commandes…</template>
</SocleTabs>
```

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `tabs` | `TabItem<T>[]` | (obligatoire) | Onglets affichés. |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Onglets au-dessus des panneaux, ou à gauche (à droite en `dir="rtl"`). |
| `activation` | `'auto' \| 'manual'` | `'auto'` | `auto` : un onglet est sélectionné dès qu'il reçoit le focus. `manual` : les flèches déplacent le focus, `Entrée` / `Espace` sélectionnent. Préférez `manual` si l'affichage d'un panneau est coûteux (requête réseau…). |
| `lazy` | `boolean` | `false` | Un panneau n'est rendu qu'à sa première sélection, puis conservé. Son contenu n'est alors pas trouvable par la recherche avant cela. |
| `ariaLabel` | `string` | | Nom accessible de la liste d'onglets. |
| `ariaLabelledby` | `string` | | Id d'un élément visible (un titre) qui nomme la liste d'onglets. Prioritaire sur `ariaLabel`. |

```ts
import type { TabItem } from 'socle-ui'

interface TabItem<V> {
  value: V          // string | number
  label: string
  disabled?: boolean
}
```

`class` et `style` s'appliquent au conteneur du composant.

## v-model

- **Valeur** : `T | null`, la `value` de l'onglet sélectionné. Le composant est générique : le type est déduit des onglets.
- **Valeur par défaut** : si le v-model est vide, inconnu ou désigne un onglet désactivé, le premier onglet actif est sélectionné et le v-model mis à jour.

## Slots

| Slot | Props | Description |
| --- | --- | --- |
| *(valeur de l'onglet)* | `{ tab, selected }` | Contenu du panneau de cet onglet : `#general` pour `value: 'general'`, `#[2]` pour `value: 2`. |
| *(défaut)* | `{ tab, selected }` | Contenu des panneaux sans slot nommé : pratique quand tous les panneaux ont la même forme. |
| `tab` | `{ tab, selected }` | Rendu personnalisé du libellé d'un onglet (icône, compteur…). |

Une valeur `tab` ou `default` entrerait en conflit avec ces slots : évitez-les.

```vue
<SocleTabs v-model="year" :tabs="years" aria-label="Année">
  <template #tab="{ tab }">
    {{ tab.label }} <span class="text-xs text-slate-400">({{ counts[tab.value] }})</span>
  </template>
  <template #default="{ tab }">
    <OrdersTable :year="tab.value" />
  </template>
</SocleTabs>
```

## Clavier

Un seul onglet est dans l'ordre de tabulation : l'onglet sélectionné. `Tab` passe ensuite au panneau.

| Touche | Action |
| --- | --- |
| `←` / `→` | Onglet précédent / suivant, en bouclant (horizontal ; inversé en `dir="rtl"`). |
| `↑` / `↓` | Onglet précédent / suivant, en bouclant (vertical). |
| `Début` / `Fin` | Premier / dernier onglet. |
| `Entrée` / `Espace` | Sélectionne l'onglet qui a le focus (mode `manual`). |

Les onglets désactivés sont sautés.

## Fonctionnement

- **Panneaux** : tous sont rendus (sauf avec `lazy`) et simplement masqués : l'état d'un formulaire placé dans un onglet est conservé quand on change d'onglet.
- **Recherche du navigateur** : un panneau masqué porte `hidden="until-found"`. Quand la recherche y trouve du texte, le navigateur déclenche `beforematch` et le composant sélectionne l'onglet. Le panneau d'un onglet désactivé porte un `hidden` simple, que la recherche ne révèle pas. Sans prise en charge de `until-found`, les panneaux masqués restent invisibles à la recherche.
- **Mise en page** : un panneau masqué garde sa boîte (`content-visibility: hidden`, hauteur nulle). L'espacement entre les onglets et le panneau est donc porté par le contenu et non par le panneau.
- **Débordement** : en horizontal, la liste défile si les onglets ne tiennent pas en largeur ; le focus amène l'onglet dans la zone visible.
