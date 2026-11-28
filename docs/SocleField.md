[← Retour au README](../README.md)

# SocleField

Habillage commun d'un champ de formulaire : label (avec astérisque si requis), message d'erreur annoncé et texte d'aide. C'est lui qu'utilisent [`SocleInput`](SocleInput.md), [`SocleSelect`](SocleSelect.md) et [`SocleDatePicker`](SocleDatePicker.md). Il sert aussi à habiller un autre contrôle avec la même présentation.

```vue
<SocleField control-id="bio" label="Biographie" :error="err" v-slot="{ describedBy }">
  <textarea
    id="bio"
    :aria-describedby="describedBy"
    :aria-invalid="err ? true : undefined"
  />
</SocleField>
```

## Props

| Prop | Type | Description |
| --- | --- | --- |
| `controlId` | `string` | (obligatoire) `id` du contrôle, cible du `<label for>`. |
| `label` | `string` | Libellé du champ. |
| `required` | `boolean` | Affiche l'astérisque. Pensez à poser `aria-required` sur le contrôle. |
| `hint` | `string` | Texte d'aide, masqué quand une erreur est affichée. |
| `error` | `string` | Message d'erreur. Pensez à poser `aria-invalid` sur le contrôle. |

## Slot par défaut

| Prop du slot | Description |
| --- | --- |
| `labelId` | `id` du label, pour `aria-labelledby` (utile pour un popover ou une liste). |
| `describedBy` | `id` du message d'erreur ou d'aide à placer dans `aria-describedby`, ou `undefined`. |

## Événements et exposition

- **`@label-click`** : émis au clic sur le label. Utile pour un contrôle qui ne doit pas être activé par ce clic : appeler `preventDefault()`, puis donner le focus soi-même.
- **Attributs** : `class`, `style` et les écouteurs non déclarés (`@focusout`, `@keydown`…) vont sur le conteneur.
- **`root`** : élément conteneur, exposé via une ref de composant. Il permet de vérifier si le focus ou un clic est à l'intérieur du champ.
