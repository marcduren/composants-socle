[← Retour au README](../README.md)

# SoclePopover

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

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `placement` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'bottom'` | Côté du bouton où s'ouvre le panneau. Retourné automatiquement si la place manque. |
| `align` | `'start' \| 'center' \| 'end'` | `'center'` | Alignement sur l'autre axe : `start` aligne sur le bord gauche (ou haut) du bouton, `end` sur le bord droit (ou bas). |
| `arrow` | `boolean` | `true` | Flèche pointant vers le bouton. |
| `persistent` | `boolean` | `false` | Le panneau ne se ferme ni par un clic extérieur, ni à l'ouverture d'un autre popover. `Échap`, le bouton et le v-model le ferment toujours. |

## Attributs transmis

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

## v-model

- **Valeur** : `boolean`, le panneau est ouvert ou fermé. Facultatif : sans v-model, le popover fonctionne seul.
- **Synchronisation** : le v-model suit toutes les fermetures natives (bouton, `Échap`, clic extérieur).
- **Méthodes exposées** : `show()`, `hide()` et `toggle()`, via une ref de composant.

## Slots

| Slot | Props | Description |
| --- | --- | --- |
| `trigger` | `{ props, open }` | Bouton déclencheur. `props` est à lier avec `v-bind` ; `open` indique si le panneau est ouvert. |
| *(défaut)* | | Contenu du panneau, avec défilement s'il dépasse. |

## Fonctionnement

- **Fermeture** : `Échap` ou un clic en dehors (« light dismiss »). Ouvrir un autre popover ferme le précédent, sauf s'il le contient. Une liste [`SocleSelect`](SocleSelect.md) ou un calendrier [`SocleDatePicker`](SocleDatePicker.md) placés dans le panneau ne le ferment pas.
- **Focus** : le focus reste sur le bouton à l'ouverture. `Tab` entre ensuite dans le panneau, même si celui-ci est loin dans le DOM. À la fermeture, le focus revient au bouton s'il était dans le panneau. Un `autofocus` dans le contenu est respecté.
- **Placement** : `position-area` place le panneau, `position-try-fallbacks` le retourne (haut ↔ bas, gauche ↔ droite) quand la place manque. Le panneau est masqué si le bouton sort de la zone visible (`position-visibility`).
- **Flèche** : les requêtes de conteneur ancré (`@container anchored(fallback: …)`) indiquent quel repli le navigateur a choisi : la flèche passe du côté du bouton. Ces règles sont injectées une seule fois par le composant (feuille adoptée), car les minifieurs CSS comme Lightning CSS ne savent pas encore les lire.
- **Animation** : fondu et léger zoom, à l'ouverture comme à la fermeture (`@starting-style`, `transition-behavior: allow-discrete`).
