<!--
  SocleTabs.vue
  Onglets accessibles (motif WAI-ARIA « Tabs ») : role="tablist" / "tab" / "tabpanel",
  tabindex itinérant, navigation aux flèches, Début / Fin.
  - Panneaux masqués par `hidden="until-found"` : la recherche du navigateur (Ctrl+F) trouve aussi
    le texte des onglets masqués, et l'événement `beforematch` sélectionne l'onglet concerné.
  - Contenu d'un panneau : slot nommé d'après la `value` de l'onglet, sinon slot par défaut ({ tab }).
  - activation : `auto` (l'onglet est sélectionné dès qu'il reçoit le focus) ou `manual`
                 (les flèches déplacent le focus, Entrée / Espace sélectionnent).
  - lazy       : un panneau n'est rendu qu'à sa première sélection (puis conservé).

  Prérequis : Vue >= 3.5 (useId, generics), Tailwind CSS v4.
  <SocleTabs
    v-model="tab"
    aria-label="Fiche client"
    :tabs="[
      { value: 'general', label: 'Général' },
      { value: 'orders', label: 'Commandes' },
      { value: 'archive', label: 'Archives', disabled: true },
    ]"
  >
    <template #general>…</template>
    <template #orders>…</template>
  </SocleTabs>
-->
<script setup lang="ts" generic="T extends string | number">
import { computed, reactive, useId, watch } from 'vue'

export interface TabItem<V> {
  value: V
  label: string
  disabled?: boolean
}

export type TabsOrientation = 'horizontal' | 'vertical'
export type TabsActivation = 'auto' | 'manual'

const props = withDefaults(
  defineProps<{
    tabs: TabItem<T>[]
    /** Disposition : onglets au-dessus (horizontal) ou à gauche (vertical) des panneaux. */
    orientation?: TabsOrientation
    /** auto : le focus sélectionne l'onglet ; manual : Entrée / Espace pour sélectionner. */
    activation?: TabsActivation
    /** Ne rend un panneau qu'à sa première sélection (le contenu est ensuite conservé). */
    lazy?: boolean
    /** Nom accessible de la liste d'onglets. */
    ariaLabel?: string
    /** Id d'un élément visible qui nomme la liste d'onglets (prioritaire sur ariaLabel). */
    ariaLabelledby?: string
  }>(),
  { orientation: 'horizontal', activation: 'auto', lazy: false },
)

const model = defineModel<T | null>({ default: null })

type SlotProps = { tab: TabItem<T>; selected: boolean }

defineSlots<
  {
    /** Rendu personnalisé du libellé d'un onglet. */
    tab?(props: SlotProps): unknown
    /** Contenu d'un panneau qui n'a pas de slot nommé d'après sa valeur. */
    default?(props: SlotProps): unknown
  } & {
    /** Contenu du panneau dont la `value` est le nom du slot. */
    [value: string]: ((props: SlotProps) => unknown) | undefined
  }
>()

/* ---------- Identifiants ---------- */
const uid = useId()
const tabId = (i: number) => `${uid}-tab-${i}`
const panelId = (i: number) => `${uid}-panel-${i}`

/* ---------- Sélection ---------- */
const firstEnabled = () => props.tabs.findIndex((t) => !t.disabled)

const selectedIndex = computed(() => {
  const i = props.tabs.findIndex((t) => t.value === model.value)
  return i >= 0 && !props.tabs[i]!.disabled ? i : firstEnabled()
})

// v-model vide, inconnu ou désactivé : on le remet sur l'onglet réellement affiché.
watch(
  selectedIndex,
  (i) => {
    const tab = props.tabs[i]
    if (tab && tab.value !== model.value) model.value = tab.value
  },
  { immediate: true },
)

/** Panneaux déjà affichés (mode lazy). */
const visited = reactive(new Set()) as Set<T>
watch(
  () => props.tabs[selectedIndex.value]?.value,
  (v) => {
    if (v !== undefined) visited.add(v)
  },
  { immediate: true },
)

function select(i: number) {
  const tab = props.tabs[i]
  if (tab && !tab.disabled) model.value = tab.value
}

/* ---------- Clavier ---------- */

/** Prochain onglet actif dans la direction donnée, en bouclant ; -1 si aucun. */
function nextEnabled(from: number, dir: 1 | -1): number {
  const n = props.tabs.length
  for (let k = 1; k <= n; k++) {
    const i = (((from + dir * k) % n) + n) % n
    if (!props.tabs[i]!.disabled) return i
  }
  return -1
}

function focusTab(i: number) {
  if (i < 0) return
  document.getElementById(tabId(i))?.focus()
  if (props.activation === 'auto') select(i)
}

function onKeydown(e: KeyboardEvent, i: number) {
  const vertical = props.orientation === 'vertical'
  const rtl = getComputedStyle(e.currentTarget as Element).direction === 'rtl'
  const prevKey = vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft'
  const nextKey = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight'

  let target: number
  switch (e.key) {
    case prevKey:
      target = nextEnabled(i, -1)
      break
    case nextKey:
      target = nextEnabled(i, 1)
      break
    case 'Home':
      target = nextEnabled(-1, 1)
      break
    case 'End':
      target = nextEnabled(props.tabs.length, -1)
      break
    default:
      return // Entrée / Espace : clic natif du bouton
  }
  e.preventDefault()
  focusTab(target)
}

/* ---------- Classes (exclusives : pas de conflit d'ordre CSS Tailwind) ---------- */
const vertical = computed(() => props.orientation === 'vertical')

function tabClass(i: number) {
  return [
    vertical.value ? '-me-px rounded-s-md border-e-2 text-start' : 'rounded-t-md border-b-2',
    i === selectedIndex.value
      ? 'border-teal-600 text-teal-700'
      : 'border-transparent text-slate-600 enabled:hover:border-slate-300 enabled:hover:text-slate-900',
  ]
}
</script>

<template>
  <div :class="vertical ? 'flex' : ''">
    <div
      role="tablist"
      :aria-label="ariaLabelledby ? undefined : ariaLabel"
      :aria-labelledby="ariaLabelledby"
      :aria-orientation="vertical ? 'vertical' : undefined"
      :class="
        vertical
          ? 'flex shrink-0 flex-col border-e border-slate-200'
          : 'flex overflow-x-auto shadow-[inset_0_-1px_0_var(--color-slate-200)]'
      "
    >
      <button
        v-for="(t, i) in tabs"
        :id="tabId(i)"
        :key="t.value"
        type="button"
        role="tab"
        :aria-selected="i === selectedIndex"
        :aria-controls="panelId(i)"
        :tabindex="i === selectedIndex ? 0 : -1"
        :disabled="t.disabled"
        class="cursor-pointer whitespace-nowrap px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-600/40 disabled:cursor-not-allowed disabled:opacity-40"
        :class="tabClass(i)"
        @click="select(i)"
        @keydown="onKeydown($event, i)"
      >
        <slot name="tab" :tab="t" :selected="i === selectedIndex">{{ t.label }}</slot>
      </button>
    </div>

    <div :class="vertical ? 'min-w-0 flex-1' : ''">
      <!--
        Panneau masqué : hidden="until-found" (repli : hidden simple pour un onglet désactivé,
        que la recherche ne doit pas révéler). Aucune marge ni bordure sur le panneau lui-même :
        masqué, il garde sa boîte (content-visibility: hidden) ; l'espacement est sur le contenu.
      -->
      <div
        v-for="(t, i) in tabs"
        :id="panelId(i)"
        :key="t.value"
        role="tabpanel"
        :aria-labelledby="tabId(i)"
        tabindex="0"
        :hidden="i === selectedIndex ? false : t.disabled ? true : 'until-found'"
        class="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40"
        @beforematch="select(i)"
      >
        <div v-if="!lazy || visited.has(t.value)" :class="vertical ? 'ps-6' : 'pt-4'">
          <slot :name="String(t.value)" :tab="t" :selected="i === selectedIndex">
            <slot :tab="t" :selected="i === selectedIndex" />
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>
