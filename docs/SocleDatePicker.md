[← Retour au README](../README.md)

# SocleDatePicker

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

## Props

En plus des [props communes](../README.md#champs-de-formulaire) :

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `min` | `string` | | Date minimale incluse, au format `YYYY-MM-DD`. |
| `max` | `string` | | Date maximale incluse, au format `YYYY-MM-DD`. |
| `placeholder` | `string` | `'Choisir une date'` | Texte affiché tant qu'aucune date n'est choisie. |
| `locale` | `string` | `'fr-FR'` | Langue des noms de mois et de jours (via `Intl`). |
| `firstDayOfWeek` | `0`–`6` | `1` | Premier jour de la semaine : `0` = dimanche, `1` = lundi… |
| `ariaLabel` | `string` | | Nom accessible quand il n'y a pas de `label` visible. À défaut : « Calendrier ». |
| `labels` | `Partial<Labels>` | | Textes des boutons (voir ci-dessous). |

## v-model

- **Valeur** : chaîne ISO `"YYYY-MM-DD"` ou `null`.
- **Pas de fuseau horaire** : la date est en heure locale. Pas de décalage d'un jour selon le fuseau de l'utilisateur.
- **Dates invalides** : une valeur comme `2026-02-31` est ignorée.

## Fonctionnement

- **Navigation** : les boutons `‹` `›` changent de mois, `«` `»` d'année.
- **Choix de l'année** : un clic sur le titre du mois ouvre une grille de 12 années, pratique pour une date de naissance ou une échéance lointaine.
- **Raccourcis** : le pied du calendrier propose « Aujourd'hui » et « Effacer ».
- **Bornes** : les dates hors de `min` / `max` sont désactivées et ne peuvent pas être atteintes au clavier.

## Libellés

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

## Clavier

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
