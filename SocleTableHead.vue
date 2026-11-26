<!--
  SocleTableHead.vue
  Ligne d'en-têtes d'un tableau, à placer entre <thead> et </thead> : colonnes redimensionnables
  (souris, tactile, clavier) et triables. Chaque colonne a un nom, un libellé, un type
  (string, date, number) et une largeur.

  Le composant ne trie pas les lignes : il met à jour v-model:sort ({ name, direction }),
  et l'appelant trie ses données, avec sortRows() (socle/table) ou sa propre fonction.

  <table>
    <thead>
      <SocleTableHead v-model:sort="sort" v-model:widths="widths" :columns="columns" />
    </thead>
    <tbody>
      <tr v-for="row in sortRows(orders, columns, sort)" :key="row.id">…</tr>
    </tbody>
  </table>

  - Largeurs : posées sur les <th> ; le tableau passe en `table-layout: fixed` et prend pour
               largeur la somme des colonnes (désactivable avec :auto-table-width="false").
               Placer le tableau dans un conteneur `overflow-x-auto`.
  - Redimensionner : glisser le bord droit d'un en-tête ; double-clic = largeur initiale ;
                     au clavier, ← / → sur la poignée (Maj = pas ×5), Début / Fin = min / max.
  - Trier : clic sur l'en-tête d'une colonne `sortable` → croissant, décroissant, sans tri.

  Prérequis : Vue >= 3.5 (defineModel, generics), Tailwind CSS v4.
-->
<script setup lang="ts" generic="R">
import { computed, onBeforeUnmount, onMounted, ref, watchEffect } from 'vue'
import {
  DEFAULT_COLUMN_MIN_WIDTH,
  DEFAULT_COLUMN_WIDTH,
  type SortDirection,
  type TableColumn,
  type TableSort,
} from './table'
import './socle.css'

interface Labels {
  /** Nom accessible de la poignée, suivi du libellé de la colonne. */
  resize: string
}

const defaultLabels: Labels = {
  resize: 'Redimensionner la colonne',
}

const props = withDefaults(
  defineProps<{
    columns: TableColumn<R>[]
    /** Passe le tableau en `table-layout: fixed`, avec pour largeur la somme des colonnes. */
    autoTableWidth?: boolean
    /** Pas du redimensionnement au clavier, en pixels (×5 avec Maj). */
    step?: number
    labels?: Partial<Labels>
  }>(),
  { autoTableWidth: true, step: 10 },
)

/** Tri courant : nom de la colonne et sens, ou null. */
const sort = defineModel<TableSort | null>('sort', { default: null })
/** Largeurs modifiées par l'utilisateur, par nom de colonne (en pixels). */
const widths = defineModel<Record<string, number>>('widths', { default: () => ({}) })

defineSlots<{
  /** Contenu d'un en-tête, à la place du libellé. */
  header?(props: { column: TableColumn<R>; direction: SortDirection | null }): unknown
}>()

const L = computed<Labels>(() => ({ ...defaultLabels, ...props.labels }))

/* ---------- Largeurs ---------- */
const minOf = (c: TableColumn<R>) => c.minWidth ?? DEFAULT_COLUMN_MIN_WIDTH
const maxOf = (c: TableColumn<R>) => c.maxWidth ?? Infinity

function clamp(c: TableColumn<R>, w: number) {
  return Math.round(Math.min(Math.max(w, minOf(c)), maxOf(c)))
}

function widthOf(c: TableColumn<R>) {
  return clamp(c, widths.value[c.name] ?? c.width ?? DEFAULT_COLUMN_WIDTH)
}

function setWidth(c: TableColumn<R>, w: number) {
  const next = clamp(c, w)
  if (next !== widths.value[c.name]) widths.value = { ...widths.value, [c.name]: next }
}

/** Revient à la largeur initiale de la colonne. */
function resetWidth(c: TableColumn<R>) {
  if (!(c.name in widths.value)) return
  const { [c.name]: _, ...rest } = widths.value
  widths.value = rest
}

/* ---------- Largeur du tableau ---------- */
const row = ref<HTMLTableRowElement | null>(null)
const table = ref<HTMLTableElement | null>(null)
let initialTableStyle: { tableLayout: string; width: string } | null = null

const totalWidth = computed(() => props.columns.reduce((sum, c) => sum + widthOf(c), 0))

onMounted(() => {
  table.value = row.value?.closest('table') ?? null
  if (table.value) {
    initialTableStyle = { tableLayout: table.value.style.tableLayout, width: table.value.style.width }
  }
})

watchEffect(() => {
  const t = table.value
  if (!t || !initialTableStyle) return
  if (props.autoTableWidth) {
    t.style.tableLayout = 'fixed'
    t.style.width = `${totalWidth.value}px`
  } else {
    Object.assign(t.style, initialTableStyle)
  }
})

/* ---------- Redimensionnement à la souris / au doigt ---------- */
const resizing = ref<string | null>(null)
/** État du glisser ; `startWidths` permet à Échap de rendre le v-model tel qu'il était. */
let drag: { startX: number; startWidth: number; startWidths: Record<string, number>; sign: 1 | -1 } | null = null

function onResizeStart(e: PointerEvent, c: TableColumn<R>) {
  if (e.button !== 0) return
  e.preventDefault()
  const handle = e.currentTarget as HTMLElement
  handle.setPointerCapture(e.pointerId)
  handle.focus()
  // En écriture de droite à gauche, la poignée est sur le bord gauche : le sens s'inverse.
  const sign = getComputedStyle(handle).direction === 'rtl' ? -1 : 1
  drag = { startX: e.clientX, startWidth: widthOf(c), startWidths: widths.value, sign }
  resizing.value = c.name
  document.documentElement.classList.add('socle-table-resizing')
}

function onResizeMove(e: PointerEvent, c: TableColumn<R>) {
  if (!drag || resizing.value !== c.name) return
  setWidth(c, drag.startWidth + drag.sign * (e.clientX - drag.startX))
}

function onResizeEnd(e: PointerEvent) {
  const handle = e.currentTarget as HTMLElement
  if (handle.hasPointerCapture(e.pointerId)) handle.releasePointerCapture(e.pointerId)
  stopResize()
}

function stopResize() {
  drag = null
  resizing.value = null
  document.documentElement.classList.remove('socle-table-resizing')
}

/* ---------- Redimensionnement au clavier ---------- */
function onResizeKeydown(e: KeyboardEvent, c: TableColumn<R>) {
  const step = e.shiftKey ? props.step * 5 : props.step
  const rtl = getComputedStyle(e.currentTarget as HTMLElement).direction === 'rtl'
  const grow = rtl ? 'ArrowLeft' : 'ArrowRight'
  switch (e.key) {
    case 'ArrowLeft':
    case 'ArrowRight':
      setWidth(c, widthOf(c) + (e.key === grow ? step : -step))
      break
    case 'Home':
      setWidth(c, minOf(c))
      break
    case 'End':
      if (c.maxWidth === undefined) return
      setWidth(c, c.maxWidth)
      break
    case 'Escape':
      // Pendant un glisser : annule, et rend v-model:widths tel qu'il était (sans entrée ajoutée).
      if (!drag) return
      widths.value = drag.startWidths
      stopResize()
      break
    default:
      return
  }
  e.preventDefault()
}

onBeforeUnmount(() => {
  stopResize()
  if (table.value && initialTableStyle) Object.assign(table.value.style, initialTableStyle)
})

/* ---------- Tri ---------- */
function directionOf(c: TableColumn<R>): SortDirection | null {
  return sort.value?.name === c.name ? sort.value.direction : null
}

/** Croissant → décroissant → sans tri. */
function toggleSort(c: TableColumn<R>) {
  const d = directionOf(c)
  sort.value = d === null ? { name: c.name, direction: 'asc' } : d === 'asc' ? { name: c.name, direction: 'desc' } : null
}

function ariaSort(c: TableColumn<R>) {
  const d = directionOf(c)
  return d === 'asc' ? 'ascending' : d === 'desc' ? 'descending' : undefined
}
</script>

<template>
  <tr ref="row">
    <th
      v-for="col in columns"
      :key="col.name"
      scope="col"
      :aria-sort="ariaSort(col)"
      class="relative px-3 py-2 align-middle text-sm font-medium text-slate-700"
      :class="col.type === 'number' ? 'text-right' : 'text-left'"
      :style="{ width: `${widthOf(col)}px` }"
    >
      <button
        v-if="col.sortable"
        type="button"
        class="group/sort -mx-1 flex w-[calc(100%+0.5rem)] min-w-0 cursor-pointer items-center gap-1 rounded px-1 outline-none hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-teal-600/50"
        :class="col.type === 'number' ? 'flex-row-reverse' : ''"
        @click="toggleSort(col)"
      >
        <span class="min-w-0 truncate">
          <slot name="header" :column="col" :direction="directionOf(col)">{{ col.label }}</slot>
        </span>
        <!-- Croissant / décroissant / triable (visible au survol et au focus) -->
        <svg
          class="size-4 shrink-0"
          :class="
            directionOf(col)
              ? 'text-teal-600'
              : 'text-slate-400 opacity-0 group-hover/sort:opacity-100 group-focus-visible/sort:opacity-100'
          "
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path v-if="directionOf(col) === 'asc'" d="M10 15.5v-11m-4.5 4.5L10 4.5 14.5 9" />
          <path v-else-if="directionOf(col) === 'desc'" d="M10 4.5v11m-4.5-4.5 4.5 4.5 4.5-4.5" />
          <path v-else d="m6.5 8 3.5-3.5L13.5 8m-7 4 3.5 3.5 3.5-3.5" />
        </svg>
      </button>

      <span v-else class="block truncate">
        <slot name="header" :column="col" :direction="null">{{ col.label }}</slot>
      </span>

      <!-- Poignée : bord droit de l'en-tête (motif « window splitter » de l'APG) -->
      <span
        v-if="col.resizable !== false"
        role="separator"
        aria-orientation="vertical"
        tabindex="0"
        :aria-label="`${L.resize} « ${col.label} »`"
        :aria-valuenow="widthOf(col)"
        :aria-valuemin="minOf(col)"
        :aria-valuemax="col.maxWidth"
        class="group/resize absolute inset-y-0 -end-1.5 z-10 w-3 cursor-col-resize touch-none select-none outline-none"
        @pointerdown="onResizeStart($event, col)"
        @pointermove="onResizeMove($event, col)"
        @pointerup="onResizeEnd"
        @pointercancel="onResizeEnd"
        @keydown="onResizeKeydown($event, col)"
        @dblclick="resetWidth(col)"
      >
        <span
          class="absolute inset-y-1.5 left-1/2 w-0.5 -translate-x-1/2 rounded-full transition-colors motion-reduce:transition-none"
          :class="
            resizing === col.name
              ? 'bg-teal-600'
              : 'bg-slate-200 group-hover/resize:bg-slate-400 group-focus-visible/resize:bg-teal-600'
          "
        />
      </span>
    </th>
  </tr>
</template>
