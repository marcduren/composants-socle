/*
  table.ts — types et tri des tableaux, utilisés avec SocleTableHead.

  Le composant affiche les en-têtes et met à jour l'état du tri (v-model:sort) ;
  c'est l'appelant qui trie ses lignes, avec sortRows() ou sa propre fonction.
  Le `name` de chaque colonne fait le lien entre les deux.
*/

/** Type des valeurs d'une colonne : détermine l'ordre de tri et l'alignement. */
export type ColumnType = 'string' | 'date' | 'number'

export type SortDirection = 'asc' | 'desc'

/** État du tri : colonne (par son `name`) et sens. `null` = pas de tri. */
export interface TableSort {
  name: string
  direction: SortDirection
}

export interface TableColumn<R = any> {
  /** Identifiant de la colonne, transmis au tri. Par défaut, sortRows() lit `row[name]`. */
  name: string
  /** Libellé affiché dans l'en-tête. */
  label: string
  /** Type des valeurs (défaut : 'string'). Les colonnes 'number' sont alignées à droite. */
  type?: ColumnType
  /** La colonne peut être triée par un clic sur son en-tête. */
  sortable?: boolean
  /** Largeur initiale en pixels (défaut : 160). */
  width?: number
  /** Largeur minimale en pixels (défaut : 80, de quoi garder « Abc… » et la flèche de tri lisibles). */
  minWidth?: number
  /** Largeur maximale en pixels (pas de limite par défaut). */
  maxWidth?: number
  /** La colonne peut être redimensionnée (défaut : true). */
  resizable?: boolean
  /** Valeur utilisée pour le tri, si elle n'est pas `row[name]`. */
  value?: (row: R) => unknown
  /** Comparaison personnalisée, à la place de celle du type (ordre croissant). */
  compare?: (a: R, b: R) => number
}

export const DEFAULT_COLUMN_WIDTH = 160
export const DEFAULT_COLUMN_MIN_WIDTH = 80

/** Valeur vide : placée en fin de liste, quel que soit le sens du tri. */
function isEmpty(v: unknown): boolean {
  return v === null || v === undefined || v === '' || (typeof v === 'number' && Number.isNaN(v))
}

/**
 * Date → nombre (ms). Accepte un objet Date, un horodatage, une chaîne ISO
 * (« 2026-11-26 », « 2026-11-26T10:00 ») ou française (« 26/11/2026 »).
 * Les dates sans heure sont lues en heure locale, comme dans SocleDatePicker.
 */
export function toTime(v: unknown): number {
  if (v instanceof Date) return v.getTime()
  if (typeof v === 'number') return v
  if (typeof v !== 'string') return NaN
  const s = v.trim()
  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (m) return new Date(+m[1]!, +m[2]! - 1, +m[3]!).getTime()
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s)
  if (m) return new Date(+m[3]!, +m[2]! - 1, +m[1]!).getTime()
  return Date.parse(s)
}

/** Nombre, y compris écrit à la française (« 1 234,50 »). */
export function toNumber(v: unknown): number {
  if (typeof v === 'number') return v
  if (typeof v !== 'string') return NaN
  const s = v.replace(/[\s  ]/g, '').replace(',', '.')
  return s === '' ? NaN : Number(s)
}

/**
 * Trie les lignes selon l'état du tri. Renvoie un nouveau tableau (l'original n'est pas modifié).
 * Le tri est stable ; les valeurs vides vont toujours en fin de liste.
 *
 *   const rows = computed(() => sortRows(orders.value, columns, sort.value))
 */
export function sortRows<R>(
  rows: readonly R[],
  columns: readonly TableColumn<R>[],
  sort: TableSort | null | undefined,
  locale = 'fr-FR',
): R[] {
  const copy = rows.slice()
  if (!sort) return copy
  const column = columns.find((c) => c.name === sort.name)
  if (!column) return copy
  const dir = sort.direction === 'desc' ? -1 : 1

  if (column.compare) {
    const compare = column.compare
    return copy.sort((a, b) => dir * compare(a, b))
  }

  const read = column.value ?? ((row: R) => (row as Record<string, unknown>)[column.name])
  const type = column.type ?? 'string'
  const collator = new Intl.Collator(locale, { numeric: true, sensitivity: 'base' })

  // Les clés sont calculées une fois par ligne, pas à chaque comparaison.
  const keyed = copy.map((row) => {
    const raw = read(row)
    const key = type === 'number' ? toNumber(raw) : type === 'date' ? toTime(raw) : raw
    return { row, key }
  })

  keyed.sort((a, b) => {
    const ea = isEmpty(a.key)
    const eb = isEmpty(b.key)
    if (ea || eb) return ea === eb ? 0 : ea ? 1 : -1
    const c =
      type === 'string' ? collator.compare(String(a.key), String(b.key)) : (a.key as number) - (b.key as number)
    return dir * c
  })

  return keyed.map((k) => k.row)
}
