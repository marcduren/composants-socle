<script setup lang="ts">
import { computed, ref } from 'vue'
import { SocleDatePicker, SocleDialog, SocleInput, SocleSelect } from 'socle-ui'
import { btnDanger, btnPrimary, btnSecondary, card, countries, form, maxBirthday } from '../shared'

const modalOpen = ref(false)
const panelOpen = ref(false)
const confirmOpen = ref(false)
const lastAction = ref('')

function confirm(answer: string) {
  lastAction.value = answer
  confirmOpen.value = false
}

const model = computed(() => JSON.stringify({ name: form.name, country: form.country, birthday: form.birthday }, null, 2))
</script>

<template>
  <section :class="card">
    <div class="flex flex-wrap items-center gap-2">
      <button type="button" :class="btnPrimary" @click="modalOpen = true">Boîte modale</button>
      <button type="button" :class="btnSecondary" @click="panelOpen = !panelOpen">
        {{ panelOpen ? 'Fermer' : 'Ouvrir' }} le panneau non modal
      </button>
      <button type="button" :class="btnSecondary" @click="confirmOpen = true">Confirmation</button>
      <span v-if="lastAction" class="text-sm text-slate-600">Dernière réponse : <strong>{{ lastAction }}</strong></span>
    </div>

    <div class="mt-6 max-w-sm">
      <SocleInput
        v-model.trim="form.name"
        label="Nom"
        hint="Le panneau non modal laisse la page utilisable : modifiez ce champ pendant qu'il est ouvert."
      />
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
      La page reste utilisable : les valeurs ci-dessous suivent la saisie en direct.
    </p>
    <pre class="mt-3 overflow-x-auto rounded-lg bg-slate-100 p-2 text-xs">{{ model }}</pre>
  </SocleDialog>

  <SocleDialog v-model="confirmOpen" title="Supprimer la commande ?" :close-on-backdrop="false" width="24rem">
    <p class="text-sm text-slate-600">Cette action est définitive. Un clic sur le fond ne ferme pas cette boîte.</p>
    <template #footer>
      <button type="button" :class="btnSecondary" @click="confirm('Annuler')">Annuler</button>
      <button type="button" :class="btnDanger" @click="confirm('Supprimer')">Supprimer</button>
    </template>
  </SocleDialog>
</template>
