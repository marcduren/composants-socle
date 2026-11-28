<script setup lang="ts">
import { ref } from 'vue'
import { SocleInput, SocleSelect, SocleTabs, type TabItem } from 'socle-ui'
import { card, countries, form } from '../shared'

const tabs: TabItem<string>[] = [
  { value: 'general', label: 'Général' },
  { value: 'delivery', label: 'Livraison' },
  { value: 'billing', label: 'Facturation' },
  { value: 'archive', label: 'Archives', disabled: true },
]
const tab = ref<string | null>(null)

const settingsTabs: TabItem<string>[] = [
  { value: 'profile', label: 'Profil' },
  { value: 'notifications', label: 'Notifications' },
  { value: 'security', label: 'Sécurité' },
]
const settingsTab = ref<string | null>('notifications')
</script>

<template>
  <div class="grid gap-6 xl:grid-cols-2">
    <section :class="card">
      <h2 id="tabs-order" class="mb-4 font-medium text-slate-700">Horizontal, activation automatique</h2>
      <SocleTabs v-model="tab" :tabs="tabs" aria-labelledby="tabs-order">
        <template #general>
          <div class="grid gap-4">
            <SocleInput v-model.trim="form.name" label="Nom" hint="Changez d'onglet : la saisie est conservée." />
            <SocleSelect v-model="form.country" label="Pays" :options="countries" />
          </div>
        </template>
        <template #delivery>
          <p class="text-sm text-slate-600">Transporteur : Colissimo, livraison en 48 h ouvrées.</p>
        </template>
        <template #billing>
          <p class="text-sm text-slate-600">Facture envoyée par e-mail à la validation de la commande.</p>
        </template>
      </SocleTabs>
      <p class="mt-4 text-sm text-slate-600">v-model : <code>{{ JSON.stringify(tab) }}</code></p>
    </section>

    <section :class="card">
      <h2 id="tabs-settings" class="mb-4 font-medium text-slate-700">Vertical, activation manuelle, lazy</h2>
      <SocleTabs
        v-model="settingsTab"
        :tabs="settingsTabs"
        orientation="vertical"
        activation="manual"
        lazy
        aria-labelledby="tabs-settings"
      >
        <template #tab="{ tab: t, selected }">
          <span class="flex items-center gap-2">
            <span class="size-1.5 rounded-full" :class="selected ? 'bg-teal-600' : 'bg-slate-300'" aria-hidden="true" />
            {{ t.label }}
          </span>
        </template>
        <template #default="{ tab: t }">
          <h3 class="font-medium">{{ t.label }}</h3>
          <p class="mt-1 text-sm text-slate-600">
            Les flèches déplacent le focus, Entrée / Espace sélectionnent. Chaque panneau n'est rendu qu'à sa
            première sélection (<code>lazy</code>).
          </p>
        </template>
      </SocleTabs>
    </section>
  </div>
</template>
