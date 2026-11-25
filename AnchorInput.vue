<!--
  Prérequis : Vue >= 3.5 (useId, defineModel), Tailwind CSS v4.
  <AnchorInput
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

  - v-model   : texte saisi. Modificateurs Vue supportés : .trim, .number, .lazy.
  - Attributs : tout attribut non déclaré (autocomplete, maxlength, min, step, inputmode, @keydown…) est transmis à l'<input>, pas au conteneur.
  - Slots     : `prefix` / `suffix` (icône, unité, bouton) à l'intérieur du champ.
  - Erreur    : la prop `error` colore le champ, affiche le message (annoncé poliment) et pose aria-invalid.

-->
<script setup lang="ts">
import { computed, onMounted, ref, useAttrs, useId, watch } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    label?: string
    type?: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url' | 'number'
    placeholder?: string
    name?: string
    /** Texte d'aide sous le champ (remplacé par `error` si présent). */
    hint?: string
    /** Message d'erreur : met le champ en erreur. */
    error?: string
    disabled?: boolean
    readonly?: boolean
    required?: boolean
  }>(),
  { type: 'text' },
)

// .trim et .number sont appliqués par Vue lui-même à l'émission de `update:modelValue` :
// le composant ne gère que .lazy (inexistant nativement pour un composant).
const [model, modifiers] = defineModel<string | number | null, 'trim' | 'number' | 'lazy'>({
  default: null,
})

defineSlots<{
  prefix?(): unknown
  suffix?(): unknown
}>()

/* ---------- Identifiants ---------- */
const uid = useId()
// Un `id` passé en attribut est repris (utile pour un <label for> externe).
const attrs = useAttrs()
const inputId = computed(() => (attrs.id as string | undefined) ?? `${uid}-input`)
const hintId = `${uid}-hint`
const errorId = `${uid}-error`

const describedBy = computed(() => (props.error ? errorId : props.hint ? hintId : undefined))

/* ---------- Valeur affichée ----------
  Pas de `:value` : il réécrirait le champ à chaque différence et casserait la frappe
  avec .trim / .number (« 1.0 » → « 1 », espace final supprimé). Comme le v-model natif,
  on n'écrit dans le DOM que si le texte saisi ne correspond pas déjà à la valeur du modèle. */
const inputEl = ref<HTMLInputElement | null>(null)
let composing = false

/** Même conversion que Vue pour .number (parseFloat, texte conservé si non numérique). */
const looseToNumber = (s: string): string | number => {
  const n = parseFloat(s)
  return Number.isNaN(n) ? s : n
}

function syncDom() {
  const el = inputEl.value
  if (!el || composing) return
  const v = model.value
  const next = v == null ? '' : String(v)
  if (el.value === next) return
  const root = el.getRootNode() as Document | ShadowRoot
  if (root.activeElement === el) {
    if (modifiers.trim && el.value.trim() === next) return
    if ((modifiers.number || props.type === 'number') && looseToNumber(el.value) === v) return
  }
  el.value = next
}

onMounted(syncDom)
watch(model, syncDom, { flush: 'post' })

/** Lecture "lazy" : le modèle n'est mis à jour qu'au `change`, sinon à chaque frappe.
 *  Pendant une composition IME (japonais, chinois, accents morts…) on attend la fin. */
const emitValue = (el: HTMLInputElement) => {
  model.value = el.value
}
const onInput = (e: Event) => {
  if (!modifiers.lazy && !composing) emitValue(e.target as HTMLInputElement)
}
const onChange = (e: Event) => {
  if (modifiers.lazy) emitValue(e.target as HTMLInputElement)
}
const onCompositionStart = () => {
  composing = true
}
const onCompositionEnd = (e: CompositionEvent) => {
  composing = false
  if (!modifiers.lazy) emitValue(e.target as HTMLInputElement)
}

/* ---------- Classes (exclusives : pas de conflit d'ordre CSS Tailwind) ---------- */
const boxClass = computed(() => [
  props.readonly ? 'bg-slate-50' : 'bg-white',
  props.error
    ? 'border-red-500 focus-within:border-red-600 focus-within:ring-red-600/30'
    : [
        'border-slate-300 focus-within:border-teal-600 focus-within:ring-teal-600/30',
        props.disabled ? '' : 'hover:border-slate-400',
      ],
  props.disabled ? 'cursor-not-allowed opacity-50' : '',
])
</script>

<template>
  <div class="w-full max-w-xs" :class="$attrs.class" :style="$attrs.style as any">
    <label
      v-if="label"
      :for="inputId"
      class="mb-1.5 block text-sm font-medium text-slate-700"
    >
      {{ label }}
      <span v-if="required" class="text-red-600" aria-hidden="true">*</span>
    </label>

    <!-- Le conteneur porte la bordure : le focus d'un seul <input> l'éclaire en entier -->
    <div
      class="flex items-center gap-2 rounded-lg border px-3 text-slate-900 shadow-xs transition-colors focus-within:ring-2"
      :class="boxClass"
    >
      <span v-if="$slots.prefix" class="flex shrink-0 items-center text-slate-500">
        <slot name="prefix" />
      </span>

      <input
        v-bind="{ ...$attrs, class: undefined, style: undefined }"
        ref="inputEl"
        :id="inputId"
        :type="type"
        :name="name"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="describedBy"
        class="min-w-0 flex-1 bg-transparent py-2 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
        @input="onInput"
        @change="onChange"
        @compositionstart="onCompositionStart"
        @compositionend="onCompositionEnd"
      />

      <span v-if="$slots.suffix" class="flex shrink-0 items-center text-slate-500">
        <slot name="suffix" />
      </span>
    </div>

    <!-- Zone d'erreur toujours présente : une région live "polite" doit exister avant que son contenu change.
         Moins intrusif que role="alert", qui interrompt et empile les annonces de tous les champs à l'envoi. -->
    <p :id="errorId" aria-live="polite" class="text-xs text-red-600" :class="{ 'mt-1.5': error }">{{ error }}</p>
    <p v-if="hint && !error" :id="hintId" class="mt-1.5 text-xs text-slate-500">{{ hint }}</p>
  </div>
</template>
