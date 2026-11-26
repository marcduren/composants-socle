<!--
  SoclePopover.vue
  Panneau flottant ancré à un bouton : menu d'actions, aide contextuelle, petit formulaire…
  Tout le comportement est natif, sans JavaScript de positionnement :
  - API Popover (`popovertarget`) : ouverture / fermeture au clic, top layer, fermeture par Échap
    et par clic extérieur (light dismiss), retour du focus au bouton, aria-expanded implicite,
    ordre de tabulation bouton → panneau.
  - CSS Anchor Positioning : `position-area`, `position-try-fallbacks` (retournement automatique
    quand la place manque), `position-visibility` (masqué si le bouton sort de la vue).
  - Requêtes de conteneur ancré (`container-type: anchored`) : la flèche suit le retournement.
  - `@starting-style` + `transition-behavior: allow-discrete` : animation d'entrée ET de sortie.

  - Slot `trigger` : reçoit `props` à lier sur le bouton déclencheur (v-bind), et `open`.
  - v-model     : ouvert / fermé (facultatif : le popover fonctionne sans).
  - placement   : côté du bouton où s'ouvre le panneau ; align : alignement sur l'autre axe.
  - class/style : appliqués au panneau (ex. largeur `class="w-72"`).

  Prérequis : Vue >= 3.5 (useId), Tailwind CSS v4.
  <SoclePopover placement="bottom" align="start" aria-label="Options d'affichage">
    <template #trigger="{ props }">
      <button v-bind="props" type="button">Options</button>
    </template>
    <p>Contenu du panneau…</p>
  </SoclePopover>
-->
<script lang="ts">
/*
  Requêtes de conteneur ancré : la flèche suit le retournement du panneau.
  Elles ne sont pas dans socle.css car les minifieurs CSS (Lightning CSS, utilisé par Vite)
  ne connaissent pas encore `anchored(…)` et feraient échouer le build de l'application.
  Injectées une seule fois, et seulement si le navigateur les comprend
  (sinon socle.css masque la flèche).
*/
const anchoredCss = `
  @container anchored(fallback: flip-block) { .socle-popover-arrow { --_fy: 1; } }
  @container anchored(fallback: flip-inline) { .socle-popover-arrow { --_fx: 1; } }
  @container anchored(fallback: flip-block flip-inline) { .socle-popover-arrow { --_fx: 1; --_fy: 1; } }
  @container anchored(fallback: flip-inline flip-block) { .socle-popover-arrow { --_fx: 1; --_fy: 1; } }
`

let anchoredInstalled = false

function installAnchoredCss() {
  if (anchoredInstalled || typeof document === 'undefined') return
  anchoredInstalled = true
  if (!CSS.supports('container-type', 'anchored')) return
  const sheet = new CSSStyleSheet()
  sheet.replaceSync(anchoredCss)
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]
}
</script>

<script setup lang="ts">
import { computed, onMounted, ref, useId, watch } from 'vue'
import './socle.css'

export type PopoverPlacement = 'top' | 'bottom' | 'left' | 'right'
export type PopoverAlign = 'start' | 'center' | 'end'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** Côté du bouton où s'ouvre le panneau (retourné automatiquement si la place manque). */
    placement?: PopoverPlacement
    /** Alignement sur l'autre axe : start = bord gauche (ou haut) du bouton, end = bord droit (ou bas). */
    align?: PopoverAlign
    /** Petite flèche pointant vers le bouton. */
    arrow?: boolean
    /** Persistant : ne se ferme ni par clic extérieur, ni à l'ouverture d'un autre popover.
     *  Échap, le bouton ou le v-model le ferment toujours. */
    persistent?: boolean
  }>(),
  { placement: 'bottom', align: 'center', arrow: true, persistent: false },
)

const open = defineModel<boolean>({ default: false })

defineSlots<{
  trigger?(props: {
    props: { popovertarget: string; style: Record<string, string> }
    open: boolean
  }): unknown
  default?(): unknown
}>()

/* ---------- Identifiants ---------- */
const uid = useId()
const popoverId = `${uid}-popover`
// Un nom d'ancre unique par instance (dashed-ident) pour pouvoir en afficher plusieurs.
const anchorName = `--popover-${uid.replace(/[^a-zA-Z0-9_-]/g, '')}`

/** À lier sur le bouton : le navigateur gère seul le clic, Échap, le focus et aria-expanded. */
const triggerProps = computed(() => ({
  popovertarget: popoverId,
  style: { 'anchor-name': anchorName },
}))

/* ---------- Ouverture / fermeture ---------- */
const popover = ref<HTMLElement | null>(null)

const isOpen = () => popover.value?.matches(':popover-open') ?? false

/** Bouton déclencheur : passé comme `source`, il garde le lien invocateur
 *  (retour du focus, popovers imbriqués) même lors d'une ouverture par v-model. */
const triggerEl = () => document.querySelector<HTMLElement>(`[popovertarget="${CSS.escape(popoverId)}"]`)

function show() {
  if (!popover.value || isOpen()) return
  // `source` est ignoré par les navigateurs qui ne le connaissent pas.
  ;(popover.value.showPopover as (options?: { source?: HTMLElement | null }) => void)({ source: triggerEl() })
}

function hide() {
  if (isOpen()) popover.value?.hidePopover()
}

function toggle() {
  isOpen() ? hide() : show()
}

/** Ouverture / fermeture native (bouton, Échap, clic extérieur) : on resynchronise le v-model. */
function onToggle(e: Event) {
  open.value = (e as ToggleEvent).newState === 'open'
}

/** En mode persistant (popover="manual"), le navigateur ne gère pas Échap : on le fait,
 *  et on rend le focus au bouton comme le ferait un popover « auto ». */
function onEscape(e: KeyboardEvent) {
  if (!props.persistent || e.defaultPrevented) return
  e.preventDefault()
  const focusInside = popover.value?.contains(document.activeElement)
  hide()
  if (focusInside) triggerEl()?.focus()
}

// flush: 'post' → le popover est bien dans le DOM quand on réagit.
watch(open, (v) => (v ? show() : hide()), { flush: 'post' })

onMounted(() => {
  installAnchoredCss()
  if (open.value) show()
})

defineExpose({ show, hide, toggle })
</script>

<template>
  <slot name="trigger" :props="triggerProps" :open="open" />

  <div
    :id="popoverId"
    ref="popover"
    :popover="persistent ? 'manual' : 'auto'"
    :data-placement="placement"
    :data-align="align"
    :data-arrow="arrow || undefined"
    class="socle-popover rounded-lg border border-slate-200 bg-white text-sm text-slate-900 shadow-lg"
    :style="{ '--socle-anchor': anchorName }"
    v-bind="$attrs"
    @toggle="onToggle"
    @keydown.esc="onEscape"
  >
    <span v-if="arrow" class="socle-popover-arrow" aria-hidden="true" />
    <div class="socle-popover-body">
      <slot />
    </div>
  </div>
</template>
