[← Retour au README](../README.md)

# SocleInput

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

## Props

En plus des [props communes](../README.md#champs-de-formulaire) :

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `type` | `'text' \| 'email' \| 'password' \| 'search' \| 'tel' \| 'url' \| 'number'` | `'text'` | Type de l'`<input>`. |
| `placeholder` | `string` | | Texte indicatif. |
| `readonly` | `boolean` | `false` | Lecture seule (fond grisé). |

## v-model

- **Valeur** : `string | number | null`.
- **Modificateurs** : `.trim`, `.number` et `.lazy` sont pris en charge, comme sur un `<input>` natif. La frappe n'est pas perturbée : saisir « 1.0 » avec `.number` ne réécrit pas le champ en « 1 ».

## Attributs transmis

Tout attribut non déclaré est transmis à l'`<input>` lui-même, et non au conteneur : `autocomplete`, `maxlength`, `min`, `step`, `inputmode`, `@keydown`… Un `id` passé en attribut devient celui de l'`<input>`, pratique pour un `<label for>` externe. Seuls `class` et `style` vont sur le conteneur.

## Slots

| Slot | Description |
| --- | --- |
| `prefix` | Contenu affiché dans le champ, avant le texte (icône…). |
| `suffix` | Contenu affiché dans le champ, après le texte (unité, bouton…). |

```vue
<SocleInput v-model.number="price" label="Prix" type="number" step="0.01">
  <template #suffix>€</template>
</SocleInput>
```
