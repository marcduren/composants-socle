<script setup lang="ts">
/*
  Démo : une page par famille de composants, avec une barre latérale de navigation.
  Routage minimal par l'ancre de l'URL (#/formulaire…) : pas de dépendance à vue-router,
  les liens sont de vrais <a href>, et l'historique du navigateur (précédent / suivant) fonctionne.
*/
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type Component } from 'vue'
import DialogsPage from './pages/DialogsPage.vue'
import FormPage from './pages/FormPage.vue'
import PopoversPage from './pages/PopoversPage.vue'
import TablePage from './pages/TablePage.vue'
import TabsPage from './pages/TabsPage.vue'

interface Page {
  path: string
  label: string
  intro: string
  component: Component
  /** Tracé SVG de l'icône (viewBox 0 0 20 20). */
  icon: string
}

const pages: Page[] = [
  {
    path: 'formulaire',
    label: 'Formulaire',
    intro: 'SocleInput, SocleSelect, SocleDatePicker et SocleField : validation, affichage du v-model et des données envoyées.',
    component: FormPage,
    icon: 'M4.5 3.5h11v13h-11z M7 7h6 M7 10h6 M7 13h3.5',
  },
  {
    path: 'popovers',
    label: 'Popovers',
    intro: 'API Popover et CSS Anchor Positioning : clic extérieur ou Échap pour fermer. Quand la place manque, le panneau se retourne et la flèche suit (requêtes de conteneur ancré).',
    component: PopoversPage,
    icon: 'M3.5 4.5h13v8h-7l-3 3v-3h-3z',
  },
  {
    path: 'onglets',
    label: 'Onglets',
    intro: "Flèches, Début / Fin pour changer d'onglet. Cherchez « Colissimo » avec Ctrl+F : l'onglet Livraison s'ouvre tout seul (hidden=\"until-found\").",
    component: TabsPage,
    icon: 'M3.5 16.5v-10h5v-3h8v13z M8.5 6.5h8',
  },
  {
    path: 'tableau',
    label: 'Tableau',
    intro: "Cliquez sur un en-tête pour trier ; faites glisser le bord droit d'un en-tête pour redimensionner la colonne (double-clic : largeur initiale). Au clavier : Tab jusqu'à la poignée, puis ← / →.",
    component: TablePage,
    icon: 'M3.5 4.5h13v11h-13z M3.5 8.5h13 M8.5 8.5v7',
  },
  {
    path: 'dialogues',
    label: 'Boîtes de dialogue',
    intro: 'Faites glisser le titre pour déplacer la boîte ; double-cliquez dessus pour la recentrer.',
    component: DialogsPage,
    icon: 'M3.5 4.5h13v11h-13z M3.5 7.5h13 M12.5 11.5h2',
  },
]

/* ---------- Routage par l'ancre ---------- */
const pathFromHash = () => location.hash.replace(/^#\/?/, '')
const path = ref(pathFromHash())
const current = computed(() => pages.find((p) => p.path === path.value) ?? pages[0]!)

const heading = ref<HTMLElement | null>(null)

function onHashChange() {
  path.value = pathFromHash()
}

// Changement de page : retour en haut, et focus sur le titre pour que les lecteurs d'écran
// annoncent la nouvelle page (comme lors d'un vrai chargement).
watch(current, async (page) => {
  document.title = `${page.label} — Socle`
  await nextTick()
  window.scrollTo({ top: 0 })
  heading.value?.focus()
})

onMounted(() => {
  window.addEventListener('hashchange', onHashChange)
  document.title = `${current.value.label} — Socle`
})
onBeforeUnmount(() => window.removeEventListener('hashchange', onHashChange))
</script>

<template>
  <div class="md:flex">
    <!-- ===================== Barre latérale ===================== -->
    <aside
      class="sticky top-0 z-10 border-b border-slate-200 bg-white md:h-screen md:w-60 md:shrink-0 md:border-e md:border-b-0"
    >
      <div class="px-5 pt-4 pb-2 md:pt-6 md:pb-5">
        <a href="#/" class="text-lg font-semibold outline-none focus-visible:underline">Socle</a>
        <p class="hidden text-sm text-slate-500 md:block">Démo des composants</p>
      </div>

      <nav aria-label="Pages de la démo">
        <ul class="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible">
          <li v-for="page in pages" :key="page.path" class="shrink-0">
            <a
              :href="`#/${page.path}`"
              :aria-current="page === current ? 'page' : undefined"
              class="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-teal-600/50"
              :class="page === current ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'"
            >
              <svg
                class="size-4 shrink-0"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path :d="page.icon" />
              </svg>
              {{ page.label }}
            </a>
          </li>
        </ul>
      </nav>
    </aside>

    <!-- ===================== Page ===================== -->
    <main class="min-w-0 flex-1 px-6 py-8 md:px-10 md:py-10">
      <div class="mx-auto max-w-5xl">
        <header class="mb-6">
          <h1 ref="heading" tabindex="-1" class="text-2xl font-semibold outline-none">{{ current.label }}</h1>
          <p class="mt-1 max-w-3xl text-sm text-slate-600">{{ current.intro }}</p>
        </header>

        <!-- KeepAlive : chaque page garde son état (tri, onglet, popover…) quand on la quitte. -->
        <KeepAlive>
          <component :is="current.component" :key="current.path" />
        </KeepAlive>
      </div>
    </main>
  </div>
</template>
