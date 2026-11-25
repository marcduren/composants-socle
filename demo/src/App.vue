<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { SocleDatePicker, SocleDialog, SocleField, SocleInput, SocleSelect, type SelectOption } from 'socle'

/* ---------- Formulaire ---------- */
const form = reactive({
  name: '',
  email: '',
  quantity: 1 as number | string | null,
  country: null as string | null,
  priority: null as number | null,
  delivery: null as string | null,
  birthday: null as string | null,
  comment: '',
})

const errors = reactive<Partial<Record<keyof typeof form, string>>>({})

const countries: SelectOption<string>[] = [
  { value: 'fr', label: 'France' },
  { value: 'be', label: 'Belgique' },
  { value: 'ch', label: 'Suisse' },
  { value: 'lu', label: 'Luxembourg', disabled: true },
  { value: 'ca', label: 'Canada' },
  { value: 'ma', label: 'Maroc' },
  { value: 'sn', label: 'Sénégal' },
]

const priorities: SelectOption<number>[] = [
  { value: 1, label: 'Basse' },
  { value: 2, label: 'Normale' },
  { value: 3, label: 'Haute' },
]

// Livraison possible de demain à dans trois mois.
const pad = (n: number) => String(n).padStart(2, '0')
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const today = new Date()
const minDelivery = iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1))
const maxDelivery = iso(new Date(today.getFullYear(), today.getMonth() + 3, today.getDate()))
const maxBirthday = iso(today)

const disabled = ref(false)
const submitted = ref<Record<string, string> | null>(null)

function validate() {
  for (const k of Object.keys(errors) as (keyof typeof form)[]) delete errors[k]
  if (!form.name) errors.name = 'Le nom est obligatoire.'
  if (!form.email) errors.email = "L'e-mail est obligatoire."
  else if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = "Cette adresse e-mail n'est pas valide."
  if (typeof form.quantity !== 'number' || form.quantity < 1) errors.quantity = 'Indiquez une quantité d’au moins 1.'
  if (!form.country) errors.country = 'Choisissez un pays.'
  if (!form.delivery) errors.delivery = 'Choisissez une date de livraison.'
  return Object.keys(errors).length === 0
}

/** Envoi « classique » : on montre ce que le navigateur enverrait (champs cachés compris). */
function onSubmit(e: SubmitEvent) {
  submitted.value = null
  if (!validate()) return
  const data = new FormData(e.target as HTMLFormElement)
  submitted.value = Object.fromEntries([...data.entries()].map(([k, v]) => [k, String(v)]))
}

function reset() {
  Object.assign(form, {
    name: '', email: '', quantity: 1, country: null, priority: null, delivery: null, birthday: null, comment: '',
  })
  for (const k of Object.keys(errors) as (keyof typeof form)[]) delete errors[k]
  submitted.value = null
}

const model = computed(() => JSON.stringify(form, null, 2))

/* ---------- Boîtes de dialogue ---------- */
const modalOpen = ref(false)
const panelOpen = ref(false)
const confirmOpen = ref(false)
const lastAction = ref('')

function confirm(answer: string) {
  lastAction.value = answer
  confirmOpen.value = false
}

const btn = 'cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-teal-600/50'
const btnPrimary = `${btn} bg-teal-600 text-white hover:bg-teal-700`
const btnSecondary = `${btn} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`
</script>

<template>
  <main class="mx-auto max-w-5xl space-y-10 px-6 py-10">
    <header>
      <h1 class="text-2xl font-semibold">Socle — démo</h1>
      <p class="mt-1 text-slate-600">
        Composants Vue 3 accessibles : <code>&lt;dialog&gt;</code>, popover et CSS Anchor Positioning.
      </p>
    </header>

    <!-- ===================== Formulaire ===================== -->
    <section class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 class="text-lg font-semibold">Formulaire</h2>
        <label class="flex items-center gap-2 text-sm text-slate-600">
          <input v-model="disabled" type="checkbox" class="size-4 accent-teal-600" />
          Tout désactiver
        </label>
      </div>

      <div class="grid gap-8 lg:grid-cols-[1fr_18rem]">
        <form novalidate class="grid gap-x-6 gap-y-5 sm:grid-cols-2" @submit.prevent="onSubmit">
          <SocleInput
            v-model.trim="form.name"
            label="Nom"
            name="name"
            autocomplete="name"
            :error="errors.name"
            :disabled="disabled"
            required
          />

          <SocleInput
            v-model.trim="form.email"
            label="E-mail"
            type="email"
            name="email"
            placeholder="nom@exemple.fr"
            autocomplete="email"
            hint="Pour le suivi de la commande."
            :error="errors.email"
            :disabled="disabled"
            required
          >
            <template #prefix>
              <svg class="size-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="2.5" y="4.5" width="15" height="11" rx="2" />
                <path d="m3 5.5 7 5 7-5" />
              </svg>
            </template>
          </SocleInput>

          <SocleInput
            v-model.number="form.quantity"
            label="Quantité"
            type="number"
            name="quantity"
            min="1"
            step="1"
            :error="errors.quantity"
            :disabled="disabled"
            required
          >
            <template #suffix>pièces</template>
          </SocleInput>

          <SocleInput model-value="CMD-2026-0042" label="Référence" readonly hint="Lecture seule." />

          <SocleSelect
            v-model="form.country"
            label="Pays"
            name="country"
            :options="countries"
            hint="Le Luxembourg n'est pas encore desservi."
            :error="errors.country"
            :disabled="disabled"
            required
          />

          <SocleSelect
            v-model="form.priority"
            label="Priorité"
            name="priority"
            placeholder="Normale par défaut"
            :options="priorities"
            :disabled="disabled"
          >
            <template #option="{ option, selected }">
              <span class="truncate">{{ option.label }}</span>
              <span class="flex gap-0.5" :class="selected ? 'text-white' : 'text-amber-500'" aria-hidden="true">
                <span v-for="n in option.value" :key="n">●</span>
              </span>
            </template>
          </SocleSelect>

          <SocleDatePicker
            v-model="form.delivery"
            label="Date de livraison"
            name="delivery"
            :min="minDelivery"
            :max="maxDelivery"
            hint="De demain à dans trois mois."
            :error="errors.delivery"
            :disabled="disabled"
            required
          />

          <SocleDatePicker
            v-model="form.birthday"
            label="Date de naissance"
            name="birthday"
            :max="maxBirthday"
            hint="Cliquez sur le mois pour choisir l'année."
            :disabled="disabled"
          />

          <SocleField
            v-slot="{ describedBy }"
            control-id="comment"
            label="Commentaire"
            hint="SocleField habille ici un <textarea> natif."
            class="sm:col-span-2"
          >
            <textarea
              id="comment"
              v-model="form.comment"
              name="comment"
              rows="3"
              :disabled="disabled"
              :aria-describedby="describedBy"
              class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 shadow-xs outline-none transition-colors hover:border-slate-400 focus-visible:border-teal-600 focus-visible:ring-2 focus-visible:ring-teal-600/30 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </SocleField>

          <div class="flex gap-2 sm:col-span-2">
            <button type="submit" :class="btnPrimary">Envoyer</button>
            <button type="button" :class="btnSecondary" @click="reset">Réinitialiser</button>
          </div>
        </form>

        <aside class="space-y-4 text-sm">
          <div>
            <h3 class="mb-1.5 font-medium text-slate-700">v-model</h3>
            <pre class="overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{{ model }}</pre>
          </div>
          <div v-if="submitted">
            <h3 class="mb-1.5 font-medium text-slate-700">Données envoyées (FormData)</h3>
            <pre class="overflow-x-auto rounded-lg bg-teal-950 p-3 text-xs text-teal-50">{{ JSON.stringify(submitted, null, 2) }}</pre>
          </div>
        </aside>
      </div>
    </section>

    <!-- ===================== Boîtes de dialogue ===================== -->
    <section class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 class="mb-2 text-lg font-semibold">Boîtes de dialogue</h2>
      <p class="mb-4 text-sm text-slate-600">
        Faites glisser le titre pour déplacer la boîte ; double-cliquez dessus pour la recentrer.
      </p>

      <div class="flex flex-wrap items-center gap-2">
        <button type="button" :class="btnPrimary" @click="modalOpen = true">Boîte modale</button>
        <button type="button" :class="btnSecondary" @click="panelOpen = !panelOpen">
          {{ panelOpen ? 'Fermer' : 'Ouvrir' }} le panneau non modal
        </button>
        <button type="button" :class="btnSecondary" @click="confirmOpen = true">Confirmation</button>
        <span v-if="lastAction" class="text-sm text-slate-600">Dernière réponse : <strong>{{ lastAction }}</strong></span>
      </div>
    </section>

    <SocleDialog v-model="modalOpen" title="Modifier le profil" width="32rem">
      <div class="grid gap-4">
        <p class="text-sm text-slate-600">
          Le focus reste dans la boîte ; Échap ou un clic sur le fond la ferment. Les listes et le calendrier
          s'ouvrent par-dessus, dans le top layer.
        </p>
        <SocleInput v-model.trim="form.name" label="Nom" />
        <SocleSelect v-model="form.country" label="Pays" :options="countries" />
        <SocleDatePicker v-model="form.birthday" label="Date de naissance" :max="maxBirthday" />
      </div>
      <template #footer>
        <button type="button" :class="btnSecondary" @click="modalOpen = false">Annuler</button>
        <button type="button" :class="btnPrimary" @click="modalOpen = false">Enregistrer</button>
      </template>
    </SocleDialog>

    <SocleDialog v-model="panelOpen" :modal="false" width="20rem">
      <template #title>
        <span class="flex items-center gap-2">
          <span class="size-2 rounded-full bg-teal-500" aria-hidden="true" />
          Panneau non modal
        </span>
      </template>
      <p class="text-sm text-slate-600">
        La page reste utilisable : vous pouvez continuer à remplir le formulaire pendant que ce panneau est ouvert.
      </p>
      <pre class="mt-3 overflow-x-auto rounded-lg bg-slate-100 p-2 text-xs">{{ model }}</pre>
    </SocleDialog>

    <SocleDialog v-model="confirmOpen" title="Supprimer la commande ?" :close-on-backdrop="false" width="24rem">
      <p class="text-sm text-slate-600">Cette action est définitive. Un clic sur le fond ne ferme pas cette boîte.</p>
      <template #footer>
        <button type="button" :class="btnSecondary" @click="confirm('Annuler')">Annuler</button>
        <button type="button" :class="`${btn} bg-red-600 text-white hover:bg-red-700`" @click="confirm('Supprimer')">
          Supprimer
        </button>
      </template>
    </SocleDialog>
  </main>
</template>
