/*
  Données et état partagés entre les pages de la démo.
  `form` est un état global : il est conservé d'une page à l'autre, et la boîte modale
  de la page « Boîtes de dialogue » modifie les mêmes valeurs que le formulaire.
*/
import { reactive } from 'vue'
import type { SelectOption } from 'socle-ui'

export const countries: SelectOption<string>[] = [
  { value: 'fr', label: 'France' },
  { value: 'be', label: 'Belgique' },
  { value: 'ch', label: 'Suisse' },
  { value: 'lu', label: 'Luxembourg', disabled: true },
  { value: 'ca', label: 'Canada' },
  { value: 'ma', label: 'Maroc' },
  { value: 'sn', label: 'Sénégal' },
]

export const priorities: SelectOption<number>[] = [
  { value: 1, label: 'Basse' },
  { value: 2, label: 'Normale' },
  { value: 3, label: 'Haute' },
]

/* ---------- Dates ---------- */
const pad = (n: number) => String(n).padStart(2, '0')
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const today = new Date()
// Livraison possible de demain à dans trois mois.
export const minDelivery = iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1))
export const maxDelivery = iso(new Date(today.getFullYear(), today.getMonth() + 3, today.getDate()))
export const maxBirthday = iso(today)

/* ---------- Formulaire ---------- */
export const emptyForm = () => ({
  name: '',
  email: '',
  quantity: 1 as number | string | null,
  country: null as string | null,
  priority: null as number | null,
  delivery: null as string | null,
  birthday: null as string | null,
  comment: '',
})

export type Form = ReturnType<typeof emptyForm>

export const form = reactive(emptyForm())

/* ---------- Boutons ---------- */
export const btn =
  'cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-teal-600/50'
export const btnPrimary = `${btn} bg-teal-600 text-white hover:bg-teal-700`
export const btnSecondary = `${btn} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`
export const btnDanger = `${btn} bg-red-600 text-white hover:bg-red-700`

/** Cadre commun des blocs de démo. */
export const card = 'rounded-xl border border-slate-200 bg-white p-6 shadow-sm'
