<!--
  AnchorDialog.vue
  Boîte de dialogue déplaçable : on la déplace en faisant glisser son titre.
  Basée sur l'élément natif <dialog> (top layer, focus piégé en mode modal, Échap natif).
  En mode non modal, la boîte n'est pas dans le top layer : elle est passée en position fixed
  (centrée dans la fenêtre, z-50) pour garder le même comportement visuel qu'en modal.

  - v-model     : ouvre / ferme la boîte.
  - modal       : true (défaut) → showModal() avec fond assombri ; false → show(), la page reste utilisable.
  - Déplacement : glisser le titre (souris, tactile, stylet). Double-clic sur le titre = recentrer.
                  La boîte reste toujours entièrement dans la fenêtre.
  - Slots       : défaut (contenu), `title` (titre riche), `footer` (boutons d'action).

  Prérequis : Vue >= 3.5 (useId), Tailwind CSS v4.
  <AnchorDialog v-model="open" title="Modifier le profil" width="30rem">
    <p>Contenu de la boîte…</p>
    <template #footer>
      <button @click="open = false">Annuler</button>
      <button class="rounded-md bg-teal-600 px-3 py-1.5 text-sm text-white">Enregistrer</button>
    </template>
  </AnchorDialog>
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'

interface Labels {
  close: string
}

const defaultLabels: Labels = {
  close: 'Fermer',
}

const props = withDefaults(
  defineProps<{
    title?: string
    /** Modal : fond assombri, reste de la page inerte. Non modal : la page reste utilisable. */
    modal?: boolean
    /** (modal uniquement) Un clic sur le fond assombri ferme la boîte. */
    closeOnBackdrop?: boolean
    /** Largeur CSS de la boîte (plafonnée à la largeur de la fenêtre). */
    width?: string
    labels?: Partial<Labels>
  }>(),
  { modal: true, closeOnBackdrop: true, width: '28rem' },
)

const open = defineModel<boolean>({ default: false })

defineSlots<{
  default?(): unknown
  title?(): unknown
  footer?(): unknown
}>()

const L = computed<Labels>(() => ({ ...defaultLabels, ...props.labels }))

/* ---------- Identifiants ---------- */
const uid = useId()
const titleId = `${uid}-title`

/* ---------- Ouverture / fermeture ---------- */
const dialog = ref<HTMLDialogElement | null>(null)

function openDialog() {
  const el = dialog.value
  if (!el || el.open) return
  pos.value = { x: 0, y: 0 } // toujours rouvert au centre
  props.modal ? el.showModal() : el.show()
}

function closeDialog() {
  if (dialog.value?.open) dialog.value.close()
}

// flush: 'post' → le <dialog> est bien dans le DOM quand on réagit.
watch(open, (v) => (v ? openDialog() : closeDialog()), { flush: 'post' })

/** Événement natif "close" (Échap, form method="dialog", close()) : on resynchronise le v-model.
 *  L'événement est asynchrone : s'il arrive alors que la boîte a été rouverte entre-temps
 *  (bascule modal ↔ non modal), on l'ignore. */
function onClose() {
  if (dialog.value?.open) return
  open.value = false
}

/** Changement de `modal` pendant que la boîte est ouverte : on la rouvre dans le bon mode, sans la recentrer. */
watch(
  () => props.modal,
  (modal) => {
    const el = dialog.value
    if (!el?.open) return
    el.close()
    modal ? el.showModal() : el.show()
  },
  { flush: 'post' },
)

/** En mode non modal, le navigateur ne ferme pas avec Échap : on le fait. */
function onEscape(e: KeyboardEvent) {
  if (props.modal) return
  e.preventDefault()
  open.value = false
}

// Clic sur le fond : n'accepte que si le clic a AUSSI commencé sur le fond
// (évite de fermer quand on termine une sélection de texte en dehors).
// `e.target === dialog` ne suffit pas : la bordure de la boîte a aussi le <dialog> pour cible,
// on vérifie donc que le pointeur est réellement hors du rectangle de la boîte.
function isOnBackdrop(e: MouseEvent) {
  const el = dialog.value
  if (!el || e.target !== el) return false
  const r = el.getBoundingClientRect()
  return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom
}
let downOnBackdrop = false
function onDialogPointerDown(e: PointerEvent) {
  downOnBackdrop = isOnBackdrop(e)
}
function onDialogClick(e: MouseEvent) {
  if (props.modal && props.closeOnBackdrop && downOnBackdrop && isOnBackdrop(e)) {
    open.value = false
  }
  downOnBackdrop = false
}

/* ---------- Déplacement ---------- */
/** Décalage par rapport à la position centrée d'origine (appliqué via la propriété CSS `translate`). */
const pos = ref({ x: 0, y: 0 })
const dragging = ref(false)

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)

/** Plage de décalage autorisée pour que la boîte reste entièrement visible. */
function limits(rect: DOMRect) {
  const vw = document.documentElement.clientWidth
  const vh = document.documentElement.clientHeight
  return { minX: -rect.left, maxX: vw - rect.right, minY: -rect.top, maxY: vh - rect.bottom }
}

let drag: { startX: number; startY: number; originX: number; originY: number; rect: DOMRect } | null = null

function onHandlePointerDown(e: PointerEvent) {
  // Bouton principal uniquement ; le bouton de fermeture garde son propre comportement.
  if (e.button !== 0 || (e.target as HTMLElement).closest('button') || !dialog.value) return
  drag = {
    startX: e.clientX,
    startY: e.clientY,
    originX: pos.value.x,
    originY: pos.value.y,
    rect: dialog.value.getBoundingClientRect(),
  }
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  dragging.value = true
}

function onHandlePointerMove(e: PointerEvent) {
  if (!drag) return
  const l = limits(drag.rect)
  const dx = clamp(e.clientX - drag.startX, l.minX, l.maxX)
  const dy = clamp(e.clientY - drag.startY, l.minY, l.maxY)
  pos.value = { x: drag.originX + dx, y: drag.originY + dy }
}

function endDrag(e: PointerEvent) {
  if (!drag) return
  drag = null
  dragging.value = false
  const el = e.currentTarget as HTMLElement
  if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
}

/** Déplacement relatif (redimensionnement de la fenêtre), toujours borné à la fenêtre. */
function moveBy(dx: number, dy: number) {
  if (!dialog.value?.open) return
  const l = limits(dialog.value.getBoundingClientRect())
  pos.value = {
    x: pos.value.x + clamp(dx, l.minX, l.maxX),
    y: pos.value.y + clamp(dy, l.minY, l.maxY),
  }
}

function resetPosition() {
  pos.value = { x: 0, y: 0 }
}

const onResize = () => moveBy(0, 0)

onMounted(() => {
  window.addEventListener('resize', onResize)
  if (open.value) openDialog()
})
onBeforeUnmount(() => window.removeEventListener('resize', onResize))
</script>

<template>
  <dialog
    ref="dialog"
    :aria-labelledby="title || $slots.title ? titleId : undefined"
    :class="!modal && 'fixed inset-0 z-50'"
    class="dlg m-auto max-h-[min(40rem,calc(100dvh-2rem))] flex-col rounded-xl border border-slate-200 bg-white p-0 text-slate-900 shadow-xl open:flex"
    :style="{
      width,
      maxWidth: 'calc(100vw - 2rem)',
      translate: `${pos.x}px ${pos.y}px`,
    }"
    @close="onClose"
    @keydown.esc="onEscape"
    @pointerdown="onDialogPointerDown"
    @click="onDialogClick"
  >
    <!-- Barre de titre = poignée de déplacement -->
    <div
      class="flex shrink-0 touch-none select-none items-center justify-between gap-2 rounded-t-xl border-b border-slate-200 bg-slate-50 py-2 pl-4 pr-2"
      :class="dragging ? 'cursor-grabbing' : 'cursor-grab'"
      @pointerdown="onHandlePointerDown"
      @pointermove="onHandlePointerMove"
      @pointerup="endDrag"
      @pointercancel="endDrag"
      @dblclick="resetPosition"
    >
      <h2 :id="titleId" class="truncate text-sm font-semibold">
        <slot name="title">{{ title }}</slot>
      </h2>

      <button
        type="button"
        :aria-label="L.close"
        class="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-600 outline-none hover:bg-slate-200/70 focus-visible:ring-2 focus-visible:ring-teal-600/50"
        @click="open = false"
      >
        <svg class="size-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="m5 5 10 10M15 5 5 15" />
        </svg>
      </button>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto px-4 py-4">
      <slot />
    </div>

    <footer
      v-if="$slots.footer"
      class="flex shrink-0 items-center justify-end gap-2 rounded-b-xl border-t border-slate-200 px-4 py-3"
    >
      <slot name="footer" />
    </footer>
  </dialog>
</template>

<style scoped>
/*
  Animation d'ouverture / fermeture. `translate` (déplacement) et `scale` (animation)
  sont deux propriétés indépendantes : glisser la boîte n'est jamais ralenti par une transition.
  display / overlay en allow-discrete permettent aussi la transition de sortie.
*/
.dlg {
  opacity: 0;
  scale: 0.97;
  transition:
    opacity 150ms ease,
    scale 150ms ease,
    display 150ms allow-discrete,
    overlay 150ms allow-discrete;
}

.dlg[open] {
  opacity: 1;
  scale: 1;
}

@starting-style {
  .dlg[open] {
    opacity: 0;
    scale: 0.97;
  }
}

.dlg::backdrop {
  background: rgb(15 23 42 / 0.4);
  opacity: 0;
  transition:
    opacity 150ms ease,
    display 150ms allow-discrete,
    overlay 150ms allow-discrete;
}

.dlg[open]::backdrop {
  opacity: 1;
}

@starting-style {
  .dlg[open]::backdrop {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dlg,
  .dlg::backdrop {
    transition: none;
  }
}

/* Bloque le défilement de la page tant qu'une boîte modale est ouverte */
:global(html:has(.dlg:modal)) {
  overflow: hidden;
}
</style>
