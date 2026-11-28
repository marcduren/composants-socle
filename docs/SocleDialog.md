[← Retour au README](../README.md)

# SocleDialog

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

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `title` | `string` | | Titre affiché dans l'en-tête, qui sert aussi de nom accessible. |
| `modal` | `boolean` | `true` | `true` : fond assombri, reste de la page inerte, focus piégé dans la boîte. `false` : la page reste utilisable. |
| `closeOnBackdrop` | `boolean` | `true` | En mode modal, un clic sur le fond assombri ferme la boîte. |
| `width` | `string` | `'28rem'` | Largeur CSS de la boîte, plafonnée à la largeur de la fenêtre. |
| `labels` | `Partial<{ close: string }>` | | Libellé du bouton de fermeture (défaut : « Fermer »). |

## v-model

- **Valeur** : `boolean`, la boîte est ouverte ou fermée.
- **Synchronisation** : le v-model repasse à `false` quel que soit le mode de fermeture : bouton ✕, `Échap`, clic sur le fond, `<form method="dialog">`.

## Slots

| Slot | Description |
| --- | --- |
| *(défaut)* | Contenu de la boîte, avec défilement s'il dépasse la hauteur disponible. |
| `title` | Titre riche, à la place de la prop `title`. |
| `footer` | Pied de la boîte, en général les boutons d'action. |

## Fonctionnement

- **Déplacement** : glisser le titre à la souris, au doigt ou au stylet. Un double-clic sur le titre recentre la boîte. La boîte reste toujours entièrement visible dans la fenêtre.
- **Réouverture** : la boîte se rouvre toujours au centre.
- **Défilement** : en mode modal, la page derrière ne défile pas tant que la boîte est ouverte.
- **`Échap`** : ferme la boîte dans les deux modes.
- **Changement de mode** : modifier `modal` pendant que la boîte est ouverte la rouvre dans le nouveau mode, sans la recentrer.
