<script setup lang="ts">
import { reactive, ref } from 'vue'
import { SoclePopover, SocleSelect, type PopoverAlign, type PopoverPlacement } from 'socle-ui'
import { btnPrimary, btnSecondary, card, countries } from '../shared'

const placements: PopoverPlacement[] = ['top', 'right', 'bottom', 'left']
const aligns: PopoverAlign[] = ['start', 'center', 'end']
const placement = ref<PopoverPlacement>('bottom')
const align = ref<PopoverAlign>('center')
const filtersOpen = ref(false)
const filters = reactive({ country: null as string | null, onlyLate: false })
const lastAction = ref('')
</script>

<template>
  <section :class="card">
    <div class="grid gap-6 sm:grid-cols-[1fr_auto]">
      <div class="flex flex-wrap items-start gap-4">
        <SoclePopover :placement="placement" :align="align" role="dialog" aria-label="Exemple de placement">
          <template #trigger="{ props }">
            <button v-bind="props" type="button" :class="btnPrimary">Placement : {{ placement }} / {{ align }}</button>
          </template>
          <p class="w-56 text-slate-600">
            Faites défiler la page pour voir le panneau se retourner quand il touche le bord de la fenêtre.
          </p>
        </SoclePopover>

        <SoclePopover placement="bottom" align="start" :arrow="false" class="w-48 [--socle-popover-padding:0.25rem]">
          <template #trigger="{ props, open }">
            <button v-bind="props" type="button" :class="btnSecondary">
              Actions <span aria-hidden="true">{{ open ? '▴' : '▾' }}</span>
            </button>
          </template>
          <ul class="grid">
            <li v-for="a in ['Dupliquer', 'Archiver', 'Exporter en CSV']" :key="a">
              <button
                type="button"
                class="w-full cursor-pointer rounded-md px-2.5 py-1.5 text-left outline-none hover:bg-slate-100 focus-visible:bg-slate-100"
                @click="lastAction = a"
              >
                {{ a }}
              </button>
            </li>
          </ul>
        </SoclePopover>

        <SoclePopover v-model="filtersOpen" persistent align="end" role="dialog" aria-label="Filtres" class="w-72">
          <template #trigger="{ props }">
            <button v-bind="props" type="button" :class="btnSecondary">Filtres (persistant)</button>
          </template>
          <div class="grid gap-3">
            <SocleSelect v-model="filters.country" label="Pays" :options="countries" />
            <label class="flex items-center gap-2 text-slate-600">
              <input v-model="filters.onlyLate" type="checkbox" class="size-4 accent-teal-600" />
              En retard uniquement
            </label>
            <div class="flex justify-end">
              <button type="button" :class="btnPrimary" @click="filtersOpen = false">Appliquer</button>
            </div>
          </div>
        </SoclePopover>

        <span v-if="lastAction" class="self-center text-sm text-slate-600">Dernière action : <strong>{{ lastAction }}</strong></span>
      </div>

      <div class="grid content-start gap-3 text-sm sm:w-56">
        <SocleSelect v-model="placement" label="placement" :options="placements.map((p) => ({ value: p, label: p }))" />
        <SocleSelect v-model="align" label="align" :options="aligns.map((a) => ({ value: a, label: a }))" />
      </div>
    </div>
  </section>
</template>
