<!--
  SocleDatePicker.vue
  Sélecteur de date : bouton déclencheur + calendrier en popover ancré (CSS Anchor Positioning).

  Prérequis : Vue >= 3.5 (useId, defineModel), Tailwind CSS v4.
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

  - v-model  : chaîne ISO "YYYY-MM-DD" (ou null), en heure locale, sans fuseau horaire.
  - Années   : boutons « » (±1 an) et clic sur le titre pour ouvrir une grille d'années
               (pages de 12), pratique pour une date de naissance ou une échéance lointaine.
  - Clavier  : flèches, Début/Fin (semaine), PageHaut/PageBas (mois), Maj+PageHaut/Bas (année),
               Entrée/Espace pour choisir, Échap pour fermer (ou revenir aux jours).
  - Erreur   : comme SocleInput, la prop `error` colore le champ, affiche le message (annoncé poliment)
               et pose aria-invalid ; `hint` est affiché tant qu'il n'y a pas d'erreur.
  - required : astérisque sur le label + aria-required. La validation reste à faire côté appelant
               (un <input type="hidden"> n'est jamais validé par le navigateur).
-->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import SocleField from './SocleField.vue'
import { fieldBoxClass } from './classes'
import './socle.css'

interface Labels {
  previousMonth: string
  nextMonth: string
  today: string
  clear: string
  calendar: string
  previousYear: string
  nextYear: string
  previousYears: string
  nextYears: string
  chooseYear: string
}

const defaultLabels: Labels = {
  previousMonth: 'Mois précédent',
  nextMonth: 'Mois suivant',
  today: "Aujourd'hui",
  clear: 'Effacer',
  calendar: 'Calendrier',
  previousYear: 'Année précédente',
  nextYear: 'Année suivante',
  previousYears: '12 années précédentes',
  nextYears: '12 années suivantes',
  chooseYear: 'Choisir une année',
}

const props = withDefaults(
  defineProps<{
    label?: string
    placeholder?: string
    /** Si défini, un <input type="hidden"> (valeur ISO) est rendu pour les formulaires classiques. */
    name?: string
    disabled?: boolean
    /** Nom accessible quand il n'y a pas de `label` visible (sinon le libellé « Calendrier » est utilisé). */
    ariaLabel?: string
    /** Texte d'aide sous le champ (remplacé par `error` si présent). */
    hint?: string
    /** Message d'erreur : met le champ en erreur. */
    error?: string
    required?: boolean
    /** Dates limites incluses, au format "YYYY-MM-DD". */
    min?: string
    max?: string
    locale?: string
    /** 0 = dimanche, 1 = lundi… */
    firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6
    labels?: Partial<Labels>
  }>(),
  { placeholder: 'Choisir une date', locale: 'fr-FR', firstDayOfWeek: 1 },
)

const model = defineModel<string | null>({ default: null })

const L = computed<Labels>(() => ({ ...defaultLabels, ...props.labels }))

/* ---------- Utilitaires de dates (heure locale, sans fuseau) ---------- */
const pad = (n: number) => String(n).padStart(2, '0')
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

function fromISO(s?: string | null): Date | null {
  const m = s ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(s) : null
  if (!m) return null
  const d = new Date(+m[1]!, +m[2]! - 1, +m[3]!)
  return d.getMonth() === +m[2]! - 1 ? d : null // rejette 2026-02-31
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

function addMonths(d: Date, n: number): Date {
  const t = new Date(d.getFullYear(), d.getMonth() + n, 1)
  const lastDay = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate()
  t.setDate(Math.min(d.getDate(), lastDay)) // 31 janvier + 1 mois → 28/29 février
  return t
}

const minDate = computed(() => fromISO(props.min))
const maxDate = computed(() => fromISO(props.max))
const isDisabled = (d: Date) =>
  (!!minDate.value && d < minDate.value) || (!!maxDate.value && d > maxDate.value)

function clamp(d: Date): Date {
  if (minDate.value && d < minDate.value) return minDate.value
  if (maxDate.value && d > maxDate.value) return maxDate.value
  return d
}

/* ---------- Formatage (Intl) ---------- */
const fmtTrigger = computed(() => new Intl.DateTimeFormat(props.locale, { dateStyle: 'long' }))
const fmtMonth = computed(() => new Intl.DateTimeFormat(props.locale, { month: 'long', year: 'numeric' }))
const fmtFull = computed(() => new Intl.DateTimeFormat(props.locale, { dateStyle: 'full' }))

const weekdays = computed(() => {
  const narrow = new Intl.DateTimeFormat(props.locale, { weekday: 'narrow' })
  const long = new Intl.DateTimeFormat(props.locale, { weekday: 'long' })
  // Le 7 janvier 2024 est un dimanche : sert de référence.
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2024, 0, 7 + ((props.firstDayOfWeek + i) % 7))
    return { short: narrow.format(d), long: long.format(d) }
  })
})

/* ---------- Identifiants ---------- */
const uid = useId()
const triggerId = `${uid}-trigger`
const popoverId = `${uid}-popover`
const monthId = `${uid}-month`
// Un nom d'ancre unique par instance (dashed-ident) pour pouvoir en afficher plusieurs.
const anchorName = `--datepicker-${uid.replace(/[^a-zA-Z0-9_-]/g, '')}`

/* ---------- État ---------- */
const field = ref<InstanceType<typeof SocleField> | null>(null)
const root = computed(() => field.value?.root ?? null)
const trigger = ref<HTMLButtonElement | null>(null)
const popover = ref<HTMLElement | null>(null)
const grid = ref<HTMLElement | null>(null)
const yearsEl = ref<HTMLElement | null>(null)

const open = ref(false)
/** Jour "actif" (tabindex=0) ; le mois affiché est toujours celui du curseur. */
const cursor = ref(startOfDay(new Date()))
const todayISO = ref(toISO(new Date()))

/** Vue affichée : grille des jours, ou grille des années (pages de 12). */
const view = ref<'days' | 'years'>('days')
/** Année "active" (tabindex=0) dans la vue des années. */
const yearCursor = ref(new Date().getFullYear())

const selectedDate = computed(() => fromISO(model.value))
const triggerText = computed(() => (selectedDate.value ? fmtTrigger.value.format(selectedDate.value) : ''))

const weeks = computed(() => {
  const y = cursor.value.getFullYear()
  const m = cursor.value.getMonth()
  const offset = (new Date(y, m, 1).getDay() - props.firstDayOfWeek + 7) % 7
  // Toujours 6 semaines : la hauteur du calendrier reste stable d'un mois à l'autre.
  return Array.from({ length: 6 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = new Date(y, m, 1 - offset + w * 7 + d)
      const iso = toISO(date)
      return {
        date,
        iso,
        day: date.getDate(),
        inMonth: date.getMonth() === m,
        disabled: isDisabled(date),
        today: iso === todayISO.value,
        selected: iso === model.value,
        label: fmtFull.value.format(date),
      }
    }),
  )
})

type Cell = (typeof weeks.value)[number][number]

const isYearDisabled = (y: number) =>
  (!!minDate.value && y < minDate.value.getFullYear()) || (!!maxDate.value && y > maxDate.value.getFullYear())

const clampYear = (y: number) =>
  Math.min(
    Math.max(y, minDate.value?.getFullYear() ?? -Infinity),
    maxDate.value?.getFullYear() ?? Infinity,
  )

/** Première année de la page de 12 années affichée. */
const pageStart = computed(() => Math.floor(yearCursor.value / 12) * 12)

const years = computed(() => {
  const selectedYear = selectedDate.value?.getFullYear()
  const thisYear = new Date().getFullYear()
  return Array.from({ length: 12 }, (_, i) => {
    const year = pageStart.value + i
    return {
      year,
      disabled: isYearDisabled(year),
      selected: year === selectedYear,
      today: year === thisYear,
      current: year === cursor.value.getFullYear(),
    }
  })
})

type YearCell = (typeof years.value)[number]

// Précédent / suivant : un mois en vue des jours, 12 ans en vue des années.
const prevDisabled = computed(() => {
  if (!minDate.value) return false
  return view.value === 'years'
    ? pageStart.value <= minDate.value.getFullYear()
    : new Date(cursor.value.getFullYear(), cursor.value.getMonth(), 0) < minDate.value
})
const nextDisabled = computed(() => {
  if (!maxDate.value) return false
  return view.value === 'years'
    ? pageStart.value + 11 >= maxDate.value.getFullYear()
    : new Date(cursor.value.getFullYear(), cursor.value.getMonth() + 1, 1) > maxDate.value
})
// ±1 an (vue des jours uniquement)
const prevYearDisabled = computed(
  () => !!minDate.value && cursor.value.getFullYear() <= minDate.value.getFullYear(),
)
const nextYearDisabled = computed(
  () => !!maxDate.value && cursor.value.getFullYear() >= maxDate.value.getFullYear(),
)
const todayDisabled = computed(() => isDisabled(startOfDay(new Date())))

/* ---------- Classes (exclusives : pas de conflit d'ordre CSS Tailwind) ---------- */
const triggerClass = computed(() =>
  fieldBoxClass({ focus: 'visible', error: props.error, disabled: props.disabled }),
)

const navBtn =
  'flex size-8 shrink-0 items-center justify-center rounded-md text-slate-600 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-600/50 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent'

function yearClasses(y: YearCell) {
  return [
    y.selected
      ? 'bg-teal-600 font-medium text-white'
      : [
          y.current ? 'bg-slate-100' : '',
          y.today ? 'font-semibold text-teal-700' : 'text-slate-900',
          y.disabled ? '' : 'hover:bg-slate-100',
        ],
    y.disabled ? 'cursor-not-allowed opacity-30' : '',
  ]
}

function dayClasses(c: Cell) {
  return [
    c.selected
      ? 'bg-teal-600 font-medium text-white'
      : [
          c.inMonth ? 'text-slate-900' : 'text-slate-400',
          c.today ? 'font-semibold text-teal-700' : '',
          c.disabled ? '' : 'hover:bg-slate-100',
        ],
    c.disabled ? 'cursor-not-allowed opacity-30' : '',
    c.today ? 'after:absolute after:bottom-1 after:size-1 after:rounded-full after:bg-current' : '',
  ]
}

/* ---------- Actions ---------- */
function focusDay() {
  grid.value?.querySelector<HTMLElement>(`[data-iso="${toISO(cursor.value)}"]`)?.focus()
}

async function setCursor(d: Date, focus = true) {
  cursor.value = clamp(d)
  if (focus) {
    await nextTick()
    focusDay()
  }
}

async function show() {
  if (props.disabled || open.value) return
  todayISO.value = toISO(new Date())
  view.value = 'days'
  cursor.value = clamp(selectedDate.value ?? startOfDay(new Date()))
  open.value = true
  popover.value?.showPopover()
  await nextTick()
  focusDay()
}

function hide(restoreFocus = false) {
  if (!open.value) return
  popover.value?.hidePopover()
  open.value = false
  if (restoreFocus) trigger.value?.focus()
}

function toggle() {
  open.value ? hide() : show()
}

function select(c: Cell) {
  if (c.disabled) return
  model.value = c.iso
  hide(true)
}

function selectToday() {
  if (todayDisabled.value) return
  model.value = toISO(new Date())
  hide(true)
}

function clear() {
  model.value = null
  hide(true)
}

/* ---------- Années ---------- */
async function setYearCursor(y: number, focus = true) {
  yearCursor.value = clampYear(y)
  if (focus) {
    await nextTick()
    yearsEl.value?.querySelector<HTMLElement>(`[data-year="${yearCursor.value}"]`)?.focus()
  }
}

async function showYears() {
  view.value = 'years'
  await setYearCursor(cursor.value.getFullYear())
}

async function showDays() {
  view.value = 'days'
  await nextTick()
  focusDay()
}

function toggleView() {
  view.value === 'days' ? showYears() : showDays()
}

function prev() {
  view.value === 'days' ? setCursor(addMonths(cursor.value, -1), false) : setYearCursor(yearCursor.value - 12, false)
}

function next() {
  view.value === 'days' ? setCursor(addMonths(cursor.value, 1), false) : setYearCursor(yearCursor.value + 12, false)
}

function chooseYear(y: number) {
  if (isYearDisabled(y)) return
  // Garde le mois et le jour (31 janvier → 28/29 février si besoin)
  cursor.value = clamp(addMonths(cursor.value, (y - cursor.value.getFullYear()) * 12))
  showDays()
}

/* ---------- Clavier ---------- */
function onYearsKeydown(e: KeyboardEvent) {
  const y = yearCursor.value
  let target: number

  switch (e.key) {
    case 'ArrowLeft': target = y - 1; break
    case 'ArrowRight': target = y + 1; break
    case 'ArrowUp': target = y - 4; break
    case 'ArrowDown': target = y + 4; break
    case 'Home': target = pageStart.value; break
    case 'End': target = pageStart.value + 11; break
    case 'PageUp': target = y - 12; break
    case 'PageDown': target = y + 12; break
    default: return
  }
  e.preventDefault()
  setYearCursor(target)
}

function onGridKeydown(e: KeyboardEvent) {
  const c = cursor.value
  const weekStart = addDays(c, -((c.getDay() - props.firstDayOfWeek + 7) % 7))
  let next: Date | null = null

  switch (e.key) {
    case 'ArrowLeft': next = addDays(c, -1); break
    case 'ArrowRight': next = addDays(c, 1); break
    case 'ArrowUp': next = addDays(c, -7); break
    case 'ArrowDown': next = addDays(c, 7); break
    case 'Home': next = weekStart; break
    case 'End': next = addDays(weekStart, 6); break
    case 'PageUp': next = addMonths(c, e.shiftKey ? -12 : -1); break
    case 'PageDown': next = addMonths(c, e.shiftKey ? 12 : 1); break
    default: return
  }
  e.preventDefault()
  setCursor(next)
}

function onTriggerKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    show()
  }
}

function onEscape(e: KeyboardEvent) {
  if (!open.value) return
  e.preventDefault()
  if (view.value === 'years') showDays()
  else hide(true)
}

/* ---------- Fermeture ---------- */
function onFocusOut(e: FocusEvent) {
  const next = e.relatedTarget as Node | null
  if (open.value && next && !root.value?.contains(next)) hide()
}

function onDocumentPointerDown(e: PointerEvent) {
  if (open.value && !root.value?.contains(e.target as Node)) hide()
}

/** Comme pour SocleSelect, un clic sur le label donne le focus sans ouvrir le calendrier
 *  (par défaut, cliquer le label d'un <button> déclencherait un clic dessus). */
function onLabelClick(e: MouseEvent) {
  e.preventDefault()
  trigger.value?.focus()
}

watch(
  () => props.disabled,
  (d) => {
    if (d) hide()
  },
)

/** Garde `open` synchronisé si le navigateur ferme le popover de lui-même. */
function onToggle(e: Event) {
  open.value = (e as ToggleEvent).newState === 'open'
}

onMounted(() => document.addEventListener('pointerdown', onDocumentPointerDown))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocumentPointerDown))
</script>

<template>
  <SocleField
    ref="field"
    v-slot="{ labelId, describedBy }"
    :control-id="triggerId"
    :label="label"
    :required="required"
    :hint="hint"
    :error="error"
    :style="{ '--socle-anchor': anchorName }"
    @keydown.esc="onEscape"
    @focusout="onFocusOut"
    @label-click="onLabelClick"
  >

    <!-- Le bouton est l'ancre -->
    <button
      :id="triggerId"
      ref="trigger"
      type="button"
      aria-haspopup="dialog"
      :aria-expanded="open"
      :aria-controls="popoverId"
      :aria-label="label ? undefined : [ariaLabel ?? L.calendar, triggerText].filter(Boolean).join(', ')"
      :aria-invalid="error ? true : undefined"
      :aria-required="required || undefined"
      :aria-describedby="describedBy"
      :disabled="disabled"
      class="socle-datepicker-trigger flex w-full items-center justify-between gap-2 bg-white py-2 text-left outline-none disabled:cursor-not-allowed disabled:opacity-50"
      :class="triggerClass"
      @click="toggle"
      @keydown="onTriggerKeydown"
    >
      <span class="truncate" :class="{ 'text-slate-400': !triggerText }">
        {{ triggerText || placeholder }}
      </span>
      <svg
        class="size-4 shrink-0 text-slate-500"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="4.5" width="14" height="12.5" rx="2" />
        <path d="M3 8.5h14M7 2.5v3M13 2.5v3" />
      </svg>
    </button>

    <!-- Le calendrier est un popover (top layer) ancré au bouton -->
    <div
      :id="popoverId"
      ref="popover"
      popover="manual"
      role="dialog"
      :aria-labelledby="label ? labelId : undefined"
      :aria-label="label ? undefined : (ariaLabel ?? L.calendar)"
      class="socle-datepicker-popover rounded-xl border border-slate-200 bg-white p-3 text-slate-900 shadow-lg"
      @toggle="onToggle"
    >
      <!-- En-tête : ‹‹ année · ‹ mois · [titre cliquable → grille d'années] · › · ›› -->
      <div class="mb-2 flex items-center justify-between gap-0.5">
        <div class="flex">
          <button
            v-if="view === 'days'"
            type="button"
            :aria-label="L.previousYear"
            :disabled="prevYearDisabled"
            :class="navBtn"
            @click="setCursor(addMonths(cursor, -12), false)"
          >
            <svg class="size-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m10 5-5 5 5 5M15.5 5l-5 5 5 5" />
            </svg>
          </button>
          <button
            type="button"
            :aria-label="view === 'days' ? L.previousMonth : L.previousYears"
            :disabled="prevDisabled"
            :class="navBtn"
            @click="prev"
          >
            <svg class="size-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m12.5 5-5 5 5 5" />
            </svg>
          </button>
        </div>

        <button
          :id="monthId"
          type="button"
          :title="L.chooseYear"
          :aria-expanded="view === 'years'"
          aria-live="polite"
          class="min-w-0 flex-1 truncate rounded-md px-2 py-1 text-sm font-medium capitalize outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-600/50"
          @click="toggleView"
        >
          {{ view === 'days' ? fmtMonth.format(cursor) : `${pageStart} – ${pageStart + 11}` }}
        </button>

        <div class="flex">
          <button
            type="button"
            :aria-label="view === 'days' ? L.nextMonth : L.nextYears"
            :disabled="nextDisabled"
            :class="navBtn"
            @click="next"
          >
            <svg class="size-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m7.5 5 5 5-5 5" />
            </svg>
          </button>
          <button
            v-if="view === 'days'"
            type="button"
            :aria-label="L.nextYear"
            :disabled="nextYearDisabled"
            :class="navBtn"
            @click="setCursor(addMonths(cursor, 12), false)"
          >
            <svg class="size-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m10 5 5 5-5 5M4.5 5l5 5-5 5" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Vue des jours (tabindex roulant : un seul jour est tabulable) -->
      <div v-if="view === 'days'" ref="grid" role="grid" :aria-labelledby="monthId" @keydown="onGridKeydown">
        <div role="row" class="grid grid-cols-7">
          <div
            v-for="w in weekdays"
            :key="w.long"
            role="columnheader"
            :aria-label="w.long"
            class="flex h-8 items-center justify-center text-xs font-medium text-slate-500"
          >
            {{ w.short }}
          </div>
        </div>

        <div v-for="(week, wi) in weeks" :key="wi" role="row" class="grid grid-cols-7">
          <div v-for="cell in week" :key="cell.iso" role="gridcell" :aria-selected="cell.selected" class="flex justify-center">
            <button
              type="button"
              :data-iso="cell.iso"
              :tabindex="cell.iso === toISO(cursor) ? 0 : -1"
              :aria-label="cell.label"
              :aria-current="cell.today ? 'date' : undefined"
              :disabled="cell.disabled"
              class="relative flex size-9 items-center justify-center rounded-md text-sm tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-teal-600/50"
              :class="dayClasses(cell)"
              @click="select(cell)"
            >
              {{ cell.day }}
            </button>
          </div>
        </div>
      </div>

      <!-- Vue des années : 12 par page, même hauteur que la vue des jours (pas de saut) -->
      <div
        v-else
        ref="yearsEl"
        role="group"
        :aria-labelledby="monthId"
        class="grid h-[15.5rem] grid-cols-4 content-center gap-1"
        @keydown="onYearsKeydown"
      >
        <button
          v-for="y in years"
          :key="y.year"
          type="button"
          :data-year="y.year"
          :tabindex="y.year === yearCursor ? 0 : -1"
          :disabled="y.disabled"
          :aria-pressed="y.selected"
          :aria-current="y.today ? 'date' : undefined"
          class="flex h-10 items-center justify-center rounded-md text-sm tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-teal-600/50"
          :class="yearClasses(y)"
          @click="chooseYear(y.year)"
        >
          {{ y.year }}
        </button>
      </div>

      <!-- Pied : raccourcis -->
      <div class="mt-2 flex items-center justify-between border-t border-slate-200 pt-2">
        <button
          type="button"
          :disabled="todayDisabled"
          class="rounded-md px-2 py-1 text-sm text-teal-700 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-600/50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          @click="selectToday"
        >
          {{ L.today }}
        </button>
        <button
          type="button"
          class="rounded-md px-2 py-1 text-sm text-slate-600 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-600/50"
          @click="clear"
        >
          {{ L.clear }}
        </button>
      </div>
    </div>

    <!-- disabled : comme un champ désactivé, la valeur n'est pas envoyée avec le formulaire -->
    <input v-if="name" type="hidden" :name="name" :value="model ?? ''" :disabled="disabled" />
  </SocleField>
</template>

