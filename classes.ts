/*
  classes.ts — classes Tailwind communes aux composants Socle.

  Les noms de classes sont toujours écrits en entier (jamais construits par concaténation) :
  Tailwind ne détecte que les classes présentes telles quelles dans les sources.
  Les variantes d'un même état sont exclusives : pas de conflit d'ordre CSS Tailwind.
*/

/**
 * Pseudo-classe qui affiche l'anneau de focus :
 * - `within`  : le cadre contient l'élément focalisable (ex. <input> dans SocleInput) ;
 * - `visible` : le cadre est lui-même l'élément focalisable (ex. bouton de SocleSelect).
 */
export type FocusMode = 'within' | 'visible'

const focusClasses: Record<FocusMode, { base: string; normal: string; error: string }> = {
  within: {
    base: 'focus-within:ring-2',
    normal: 'border-slate-300 focus-within:border-teal-600 focus-within:ring-teal-600/30',
    error: 'border-red-500 focus-within:border-red-600 focus-within:ring-red-600/30',
  },
  visible: {
    base: 'focus-visible:ring-2',
    normal: 'border-slate-300 focus-visible:border-teal-600 focus-visible:ring-teal-600/30',
    error: 'border-red-500 focus-visible:border-red-600 focus-visible:ring-red-600/30',
  },
}

/**
 * Cadre d'un champ de saisie (SocleInput, SocleSelect) : bordure, anneau de focus,
 * état d'erreur et survol. La mise en page (flex, padding vertical…) reste dans le composant.
 */
export function fieldBoxClass(options: { focus: FocusMode; error?: string | boolean; disabled?: boolean }) {
  const focus = focusClasses[options.focus]
  return [
    'rounded-lg border px-3 text-slate-900 shadow-xs transition-colors',
    focus.base,
    options.error ? focus.error : focus.normal,
    options.error || options.disabled ? '' : 'hover:border-slate-400',
  ]
}
