<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { SocleDatePicker, SocleField, SocleInput, SocleSelect } from 'socle-ui'
import {
  btnPrimary,
  btnSecondary,
  card,
  countries,
  emptyForm,
  form,
  maxBirthday,
  maxDelivery,
  minDelivery,
  priorities,
  type Form,
} from '../shared'

const errors = reactive<Partial<Record<keyof Form, string>>>({})
const disabled = ref(false)
const submitted = ref<Record<string, string> | null>(null)

function clearErrors() {
  for (const k of Object.keys(errors) as (keyof Form)[]) delete errors[k]
}

function validate() {
  clearErrors()
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
  Object.assign(form, emptyForm())
  clearErrors()
  submitted.value = null
}

const model = computed(() => JSON.stringify(form, null, 2))
</script>

<template>
  <section :class="card">
    <div class="mb-6 flex justify-end">
      <label class="flex items-center gap-2 text-sm text-slate-600">
        <input v-model="disabled" type="checkbox" class="size-4 accent-teal-600" />
        Tout désactiver
      </label>
    </div>

    <div class="grid gap-8 xl:grid-cols-[1fr_18rem]">
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
          <h2 class="mb-1.5 font-medium text-slate-700">v-model</h2>
          <pre class="overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{{ model }}</pre>
        </div>
        <div v-if="submitted">
          <h2 class="mb-1.5 font-medium text-slate-700">Données envoyées (FormData)</h2>
          <pre class="overflow-x-auto rounded-lg bg-teal-950 p-3 text-xs text-teal-50">{{ JSON.stringify(submitted, null, 2) }}</pre>
        </div>
      </aside>
    </div>
  </section>
</template>
