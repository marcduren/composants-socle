<script setup lang="ts">
import { computed, ref } from 'vue'
import { SocleTableHead, sortRows, type TableColumn, type TableSort } from 'socle-ui'
import { card } from '../shared'

interface Order {
  id: number
  ref: string
  client: string
  date: string
  amount: number | null
}

const orders: Order[] = [
  { id: 1, ref: 'CMD-2026-0042', client: 'Boulangerie Martin', date: '2026-11-24', amount: 1250.5 },
  { id: 2, ref: 'CMD-2026-0007', client: 'Élise Dupont', date: '2026-02-03', amount: 89.9 },
  { id: 3, ref: 'CMD-2026-0118', client: 'atelier Zébulon', date: '2026-07-14', amount: 12000 },
  { id: 4, ref: 'CMD-2026-0009', client: 'Café du Port', date: '2025-12-31', amount: null },
  { id: 5, ref: 'CMD-2026-0100', client: 'Éditions Lumière', date: '2026-09-01', amount: 430 },
]

const columns: TableColumn<Order>[] = [
  { name: 'ref', label: 'Référence', type: 'string', sortable: true, width: 150 },
  { name: 'client', label: 'Client', type: 'string', sortable: true, width: 220, minWidth: 100 },
  { name: 'date', label: 'Date', type: 'date', sortable: true, width: 120 },
  { name: 'amount', label: 'Montant', type: 'number', sortable: true, width: 130 },
  { name: 'note', label: 'Remarque', width: 200, resizable: false },
]

const sort = ref<TableSort | null>({ name: 'date', direction: 'desc' })
const widths = ref<Record<string, number>>({})
const sortedOrders = computed(() => sortRows(orders, columns, sort.value))

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' })
const amountFormat = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
const formatDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return dateFormat.format(new Date(y!, m! - 1, d))
}
</script>

<template>
  <section :class="card">
    <div class="overflow-x-auto rounded-lg border border-slate-200">
      <table class="border-collapse text-sm">
        <thead class="border-b border-slate-200 bg-slate-50">
          <SocleTableHead v-model:sort="sort" v-model:widths="widths" :columns="columns" />
        </thead>
        <tbody>
          <tr v-for="o in sortedOrders" :key="o.id" class="border-b border-slate-100 last:border-0">
            <td class="truncate px-3 py-2 font-mono text-xs">{{ o.ref }}</td>
            <td class="truncate px-3 py-2">{{ o.client }}</td>
            <td class="truncate px-3 py-2">{{ formatDate(o.date) }}</td>
            <td class="truncate px-3 py-2 text-right tabular-nums">
              {{ o.amount === null ? '—' : amountFormat.format(o.amount) }}
            </td>
            <td class="truncate px-3 py-2 text-slate-500">Colonne non triable, largeur fixe</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 grid gap-4 text-sm sm:grid-cols-2">
      <div>
        <h2 class="mb-1.5 font-medium text-slate-700">v-model:sort</h2>
        <pre class="overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{{ JSON.stringify(sort) }}</pre>
      </div>
      <div>
        <h2 class="mb-1.5 font-medium text-slate-700">v-model:widths</h2>
        <pre class="overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{{ JSON.stringify(widths) }}</pre>
      </div>
    </div>
  </section>
</template>
