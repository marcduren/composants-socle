[← Retour au README](../README.md)

# SocleSelect

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

## Props

En plus des [props communes](../README.md#champs-de-formulaire) :

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `options` | `SelectOption<T>[]` | (obligatoire) | Options proposées. |
| `placeholder` | `string` | `'Sélectionner…'` | Texte affiché tant qu'aucune option n'est choisie. |
| `ariaLabel` | `string` | | Nom accessible quand il n'y a pas de `label` visible. À défaut, c'est le placeholder qui sert de nom. |

```ts
import type { SelectOption } from 'socle-ui'

interface SelectOption<V> {
  value: V          // string | number
  label: string
  disabled?: boolean
}
```

## v-model

- **Valeur** : `T | null`, où `T` est le type des `value` (`string` ou `number`). Le composant est générique : le type est déduit des options.

## Slots

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

## Clavier

| Touche | Action |
| --- | --- |
| `↓` / `↑` | Ouvre la liste, puis passe à l'option suivante / précédente. |
| `Début` / `Fin` | Première / dernière option. |
| `Entrée` / `Espace` | Ouvre la liste, puis choisit l'option active. |
| `Échap` | Ferme la liste. |
| `Tab` | Ferme la liste et passe au champ suivant. |
| Lettres | Recherche au clavier : ouvre la liste et va à l'option qui commence par le texte tapé (« new y » → « New York »). Retaper la même lettre passe d'une option en « b » à la suivante. |
