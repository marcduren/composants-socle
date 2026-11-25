<!--
  Prérequis : Vue >= 3.5 (useId, generics), Tailwind CSS v4.

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

  - Erreur : comme SocleInput, la prop `error` colore le champ, affiche le message (annoncé poliment)
             et pose aria-invalid ; `hint` est affiché tant qu'il n'y a pas d'erreur.
  - required : astérisque sur le label + aria-required. La validation reste à faire côté appelant
               (un <input type="hidden"> n'est jamais validé par le navigateur).
-->
<script setup lang="ts" generic="T extends string | number">
import { nextTick, onBeforeUnmount, onMounted, ref, useId, watch, computed } from 'vue'
import SocleField from './SocleField.vue'
import { fieldBoxClass } from './classes'
import './socle.css'

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
const listId = `${uid}-list`
const optionId = (i: number) => `${uid}-opt-${i}`
// Un nom d'ancre unique par instance (dashed-ident) pour pouvoir en afficher plusieurs.
const anchorName = `--select-${uid.replace(/[^a-zA-Z0-9_-]/g, '')}`

/* ---------- État ---------- */
const field = ref<InstanceType<typeof SocleField> | null>(null)
const root = computed(() => field.value?.root ?? null)
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
  if (n === 0) return
  // Point de départ : option active si la liste est ouverte, sinon option sélectionnée.
  // Sans point de départ, on cherche dès la première option ; sinon un premier caractère
  // passe à l'option suivante (taper « b » plusieurs fois parcourt les options en « b »).
  const base = open.value ? activeIndex.value : selectedIndex.value
  const start = base < 0 ? 0 : base + (buffer.length === 1 ? 1 : 0)
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

/** Comme un <select> natif, un clic sur le label donne le focus sans ouvrir la liste
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
  fieldBoxClass({ focus: 'visible', error: props.error, disabled: props.disabled }),
)

watch(activeIndex, async (i) => {
  if (!open.value || i < 0) return
  await nextTick()
  document.getElementById(optionId(i))?.scrollIntoView({ block: 'nearest' })
})
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
    @focusout="onFocusOut"
    @label-click="onLabelClick"
  >

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
      class="socle-select-trigger flex w-full items-center justify-between gap-2 bg-white py-2 text-left outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
      class="socle-select-listbox list-none overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 text-slate-900 shadow-lg"
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
  </SocleField>
</template>
