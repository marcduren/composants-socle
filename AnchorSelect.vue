<!--
  Prérequis : Vue >= 3.5 (useId, generics), Tailwind CSS v4.

  <AnchorSelect
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

  - Erreur : comme AnchorInput, la prop `error` colore le champ, affiche le message (annoncé poliment)
             et pose aria-invalid ; `hint` est affiché tant qu'il n'y a pas d'erreur.
  - required : astérisque sur le label + aria-required. La validation reste à faire côté appelant
               (un <input type="hidden"> n'est jamais validé par le navigateur).
-->
<script setup lang="ts" generic="T extends string | number">
import { nextTick, onBeforeUnmount, onMounted, ref, useId, watch, computed } from 'vue'

export interface SelectOption<V> {
  value: V
  label: string
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    options: SelectOption<T>[]
    label?: string
    placeholder?: string
    /** Si défini, un <input type="hidden"> est rendu pour les envois de formulaire classiques (PHP, etc.) */
    name?: string
    disabled?: boolean
    /** Nom accessible quand il n'y a pas de `label` visible (sinon le placeholder est utilisé). */
    ariaLabel?: string
    /** Texte d'aide sous le champ (remplacé par `error` si présent). */
    hint?: string
    /** Message d'erreur : met le champ en erreur. */
    error?: string
    required?: boolean
  }>(),
  { placeholder: 'Sélectionner…' },
)

const model = defineModel<T | null>({ default: null })

defineSlots<{
  option?(props: { option: SelectOption<T>; selected: boolean }): unknown
}>()

/* ---------- Identifiants ---------- */
const uid = useId()
const triggerId = `${uid}-trigger`
const labelId = `${uid}-label`
const listId = `${uid}-list`
const optionId = (i: number) => `${uid}-opt-${i}`
const hintId = `${uid}-hint`
const errorId = `${uid}-error`

const describedBy = computed(() => (props.error ? errorId : props.hint ? hintId : undefined))
// Un nom d'ancre unique par instance (dashed-ident) pour pouvoir en afficher plusieurs.
const anchorName = `--select-${uid.replace(/[^a-zA-Z0-9_-]/g, '')}`

/* ---------- État ---------- */
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const listbox = ref<HTMLElement | null>(null)
const open = ref(false)
const activeIndex = ref(-1)

const selectedIndex = computed(() => props.options.findIndex((o) => o.value === model.value))
const selected = computed(() => props.options[selectedIndex.value] ?? null)

/* ---------- Navigation ---------- */
/** Prochain index non désactivé dans la direction donnée, ou -1. */
function nextEnabled(from: number, dir: 1 | -1): number {
  for (let i = from + dir; i >= 0 && i < props.options.length; i += dir) {
    if (!props.options[i]!.disabled) return i
  }
  return -1
}

function move(dir: 1 | -1) {
  const n = nextEnabled(activeIndex.value, dir)
  if (n >= 0) activeIndex.value = n
}

function show() {
  if (props.disabled || open.value) return
  listbox.value?.showPopover()
  open.value = true
  activeIndex.value =
    selectedIndex.value >= 0 && !props.options[selectedIndex.value]!.disabled
      ? selectedIndex.value
      : nextEnabled(-1, 1)
}

function hide() {
  if (!open.value) return
  listbox.value?.hidePopover()
  open.value = false
  activeIndex.value = -1
}

function choose(i: number) {
  const option = props.options[i]
  if (!option || option.disabled) return
  model.value = option.value
  hide()
}

/* ---------- Recherche au clavier (typeahead) ---------- */
let buffer = ''
let bufferTimer: ReturnType<typeof setTimeout> | undefined

function typeahead(char: string) {
  buffer += char.toLowerCase()
  clearTimeout(bufferTimer)
  bufferTimer = setTimeout(() => (buffer = ''), 500)

  const n = props.options.length
  const start = Math.max(activeIndex.value, 0) + (buffer.length === 1 ? 1 : 0)
  for (let k = 0; k < n; k++) {
    const i = (start + k) % n
    const o = props.options[i]!
    if (!o.disabled && o.label.toLowerCase().startsWith(buffer)) {
      if (!open.value) show()
      activeIndex.value = i
      return
    }
  }
}

/* ---------- Événements ---------- */
function onKeydown(e: KeyboardEvent) {
  if (props.disabled) return

  switch (e.key) {
    case 'ArrowDown':
    case 'ArrowUp':
      e.preventDefault()
      if (!open.value) show()
      else move(e.key === 'ArrowDown' ? 1 : -1)
      break
    case 'Home':
    case 'End':
      if (!open.value) return
      e.preventDefault()
      activeIndex.value = e.key === 'Home' ? nextEnabled(-1, 1) : nextEnabled(props.options.length, -1)
      break
    case ' ':
      // Recherche en cours (« new y » → « New York ») : l'espace fait partie du texte cherché.
      if (buffer) {
        e.preventDefault()
        typeahead(' ')
        break
      }
    // fallthrough
    case 'Enter':
      e.preventDefault()
      if (!open.value) show()
      else choose(activeIndex.value)
      break
    case 'Escape':
      if (open.value) {
        e.preventDefault()
        hide()
      }
      break
    case 'Tab':
      hide()
      break
    default:
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) typeahead(e.key)
  }
}

function toggle() {
  open.value ? hide() : show()
}

/** Garde `open` synchronisé si le navigateur ferme le popover de lui-même. */
function onToggle(e: Event) {
  open.value = (e as ToggleEvent).newState === 'open'
}

/** Ferme la liste quand le focus quitte le composant (pas seulement sur Tab). */
function onFocusOut(e: FocusEvent) {
  if (!root.value?.contains(e.relatedTarget as Node | null)) hide()
}

/** Comme un <select> natif, un clic sur le label donne le focus sans ouvrir la liste. */
function onLabelClick() {
  trigger.value?.focus()
}

watch(
  () => props.disabled,
  (d) => {
    if (d) hide()
  },
)

function onDocumentPointerDown(e: PointerEvent) {
  if (open.value && !root.value?.contains(e.target as Node)) hide()
}

onMounted(() => document.addEventListener('pointerdown', onDocumentPointerDown))
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  clearTimeout(bufferTimer)
})

/* ---------- Classes (exclusives : pas de conflit d'ordre CSS Tailwind) ---------- */
const triggerClass = computed(() =>
  props.error
    ? 'border-red-500 focus-visible:border-red-600 focus-visible:ring-red-600/30'
    : [
        'border-slate-300 focus-visible:border-teal-600 focus-visible:ring-teal-600/30',
        props.disabled ? '' : 'hover:border-slate-400',
      ],
)

watch(activeIndex, async (i) => {
  if (!open.value || i < 0) return
  await nextTick()
  document.getElementById(optionId(i))?.scrollIntoView({ block: 'nearest' })
})
</script>

<template>
  <div ref="root" class="w-full max-w-xs" :style="{ '--anchor': anchorName }" @focusout="onFocusOut">
    <label
      v-if="label"
      :id="labelId"
      :for="triggerId"
      class="mb-1.5 block text-sm font-medium text-slate-700"
      @click.prevent="onLabelClick"
    >
      {{ label }}
      <span v-if="required" class="text-red-600" aria-hidden="true">*</span>
    </label>

    <!-- Le bouton est l'ancre -->
    <button
      :id="triggerId"
      ref="trigger"
      type="button"
      role="combobox"
      :aria-label="label ? undefined : (ariaLabel ?? placeholder)"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-controls="listId"
      :aria-activedescendant="open && activeIndex >= 0 ? optionId(activeIndex) : undefined"
      :aria-invalid="error ? true : undefined"
      :aria-required="required || undefined"
      :aria-describedby="describedBy"
      :disabled="disabled"
      class="select-trigger flex w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2 text-left text-slate-900 shadow-xs outline-none transition-colors focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
      :class="triggerClass"
      @click="toggle"
      @keydown="onKeydown"
      @keyup.space.prevent
    >
      <span class="truncate" :class="{ 'text-slate-400': !selected }">
        {{ selected?.label ?? placeholder }}
      </span>
      <svg
        class="size-4 shrink-0 text-slate-500 transition-transform duration-150 motion-reduce:transition-none"
        :class="{ 'rotate-180': open }"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="m5 7.5 5 5 5-5" />
      </svg>
    </button>

    <!-- La liste est un popover (top layer) ancré au bouton -->
    <ul
      :id="listId"
      ref="listbox"
      popover="manual"
      role="listbox"
      :aria-labelledby="label ? labelId : undefined"
      :aria-label="label ? undefined : (ariaLabel ?? placeholder)"
      class="select-listbox list-none overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 text-slate-900 shadow-lg"
      @toggle="onToggle"
      @mousedown.prevent
    >
      <li
        v-for="(opt, i) in options"
        :id="optionId(i)"
        :key="opt.value"
        role="option"
        :aria-selected="opt.value === model"
        :aria-disabled="opt.disabled || undefined"
        class="flex cursor-default select-none items-center justify-between gap-2 rounded-md px-2.5 py-1.5"
        :class="[
          opt.disabled ? 'opacity-40' : '',
          i === activeIndex && !opt.disabled && opt.value !== model ? 'bg-slate-100' : '',
          opt.value === model ? 'bg-teal-600 font-medium text-white' : '',
          // Option sélectionnée ET active : un liseré garde le curseur clavier visible
          opt.value === model && i === activeIndex ? 'ring-2 ring-inset ring-white/60' : '',
        ]"
        @mousemove="!opt.disabled && (activeIndex = i)"
        @click="choose(i)"
      >
        <slot name="option" :option="opt" :selected="opt.value === model">
          <span class="truncate">{{ opt.label }}</span>
        </slot>
        <svg
          v-if="opt.value === model"
          class="size-4 shrink-0"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="m4.5 10.5 3.5 3.5 7.5-8" />
        </svg>
      </li>
    </ul>

    <!-- disabled : comme un <select disabled>, la valeur n'est pas envoyée avec le formulaire -->
    <input v-if="name" type="hidden" :name="name" :value="model ?? ''" :disabled="disabled" />

    <!-- Zone d'erreur toujours présente : une région live "polite" doit exister avant que son contenu change.
         Moins intrusif que role="alert", qui interrompt et empile les annonces de tous les champs à l'envoi. -->
    <p :id="errorId" aria-live="polite" class="text-xs text-red-600" :class="{ 'mt-1.5': error }">{{ error }}</p>
    <p v-if="hint && !error" :id="hintId" class="mt-1.5 text-xs text-slate-500">{{ hint }}</p>
  </div>
</template>

<style scoped>
/*
  Cœur de l'ancrage : tout le positionnement est déclaratif.
  --anchor (posée sur le conteneur) est héritée par le bouton ET par la liste.
*/
.select-trigger {
  anchor-name: var(--anchor);
}

.select-listbox {
  /* Neutralise les styles par défaut de [popover] (inset: 0; margin: auto) */
  inset: auto;
  margin: 0;
  margin-block: 0.25rem;

  position-anchor: var(--anchor);
  /* Sous le bouton, bord de début aligné (s'étend vers la fin de ligne) */
  position-area: block-end span-inline-end;
  /* Même largeur que le bouton */
  width: anchor-size(width);

  /* Pas assez de place en bas ? Le navigateur retourne la liste au-dessus,
     en choisissant le côté qui offre le plus de hauteur. */
  position-try-order: most-height;
  position-try-fallbacks: flip-block;
  /* Masque la liste si le bouton sort de la zone visible (scroll d'un parent) */
  position-visibility: anchors-visible;

  /* 100% = hauteur de la zone disponible définie par position-area */
  max-height: min(18rem, 100%);

  /* Animation d'ouverture ; `display` et `overlay` en allow-discrete
     permettent aussi la transition de sortie. */
  opacity: 0;
  translate: 0 -0.25rem;
  transition:
    opacity 120ms ease,
    translate 120ms ease,
    display 120ms allow-discrete,
    overlay 120ms allow-discrete;
}

.select-listbox:popover-open {
  opacity: 1;
  translate: 0 0;
}

@starting-style {
  .select-listbox:popover-open {
    opacity: 0;
    translate: 0 -0.25rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .select-listbox {
    transition: none;
  }
}
</style>